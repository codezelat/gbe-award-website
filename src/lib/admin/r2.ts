import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const maxUploadBytes = 5 * 1024 * 1024;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for R2 uploads.`);
  return value;
}

export function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function cleanR2Folder(value: string | null) {
  if (!value) return "uploads";
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "uploads";
}

export async function uploadBufferToR2({
  body,
  contentType,
  folder,
  filename,
}: {
  body: Uint8Array;
  contentType: string;
  folder: string;
  filename?: string;
}) {
  const extension = allowedTypes.get(contentType);
  if (!extension) {
    return { ok: false as const, status: 415, error: "Upload a JPG, PNG, WebP, or AVIF image." };
  }

  if (body.byteLength > maxUploadBytes) {
    return { ok: false as const, status: 413, error: "Image must be 5MB or smaller." };
  }

  const now = new Date();
  const safeName = filename
    ? filename
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 70)
    : "";
  const key = `${cleanR2Folder(folder)}/${now.getUTCFullYear()}/${safeName ? `${safeName}-` : ""}${crypto.randomUUID()}.${extension}`;
  const bucket = requireEnv("R2_BUCKET");

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicBaseUrl = requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/g, "");
  return {
    ok: true as const,
    key,
    url: `${publicBaseUrl}/${key}`,
  };
}

export async function uploadImageToR2(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, status: 400, error: "Missing image file." };
  }

  if (!allowedTypes.has(file.type)) {
    return { ok: false as const, status: 415, error: "Upload a JPG, PNG, WebP, or AVIF image." };
  }

  if (file.size > maxUploadBytes) {
    return { ok: false as const, status: 413, error: "Image must be 5MB or smaller." };
  }

  return uploadBufferToR2({
    body: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    folder: typeof formData.get("folder") === "string" ? (formData.get("folder") as string) : "uploads",
    filename: file.name,
  });
}
