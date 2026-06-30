import { siFacebook, siInstagram, siWhatsapp, siX } from "simple-icons";

type IconProps = {
  "aria-hidden": "true";
};

type BrandIconProps = IconProps & {
  path: string;
};

function BrandIcon({ path, ...props }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d={path} />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return <BrandIcon path={siInstagram.path} {...props} />;
}

function FacebookIcon(props: IconProps) {
  return <BrandIcon path={siFacebook.path} {...props} />;
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M5.2 8.8H1.4V22h3.8V8.8ZM3.3 2.2a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM22 14.8c0-4-2.1-6.3-5.3-6.3a4.6 4.6 0 0 0-4.1 2.2h-.1V8.8H8.9V22h3.8v-6.5c0-1.7.3-3.4 2.5-3.4 2 0 2.1 2 2.1 3.5V22H22v-7.2Z" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return <BrandIcon path={siX.path} {...props} />;
}

function WhatsappIcon(props: IconProps) {
  return <BrandIcon path={siWhatsapp.path} {...props} />;
}

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/gbeaward/", Icon: FacebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/gbeaward/", Icon: InstagramIcon },
  { label: "X (Twitter)", href: "https://www.x.com/gbeaward/", Icon: XIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gbeaward/", Icon: LinkedinIcon },
  { label: "WhatsApp", href: "https://wa.link/10p065", Icon: WhatsappIcon },
];

type SocialLinksProps = {
  compact?: boolean;
};

export default function SocialLinks({ compact = false }: SocialLinksProps) {
  return (
    <nav
      className={
        compact
          ? "static z-[2] flex min-h-0 min-w-0 translate-x-0 items-center justify-center gap-8 border-0 p-0"
          : "fixed bottom-6 left-1/2 z-50 flex min-h-[64px] min-w-[360px] -translate-x-1/2 items-center justify-center gap-7 rounded-full border border-[rgba(255,176,1,0.9)] bg-gbe-bg/90 px-12 shadow-[0_12px_32px_rgba(26,26,46,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md max-[1024px]:bottom-5 max-[1024px]:min-h-[56px] max-[1024px]:w-fit max-[1024px]:min-w-[min(390px,calc(100vw-32px))] max-[1024px]:gap-7 max-[1024px]:px-9 max-[560px]:bottom-4 max-[560px]:min-h-[48px] max-[560px]:min-w-[min(358px,calc(100vw-32px))] max-[560px]:gap-6 max-[560px]:px-8"
      }
      aria-label="Social links"
    >
      {socialLinks.map(({ label, href, Icon }) => (
        <a
          className="grid h-8 w-8 place-items-center text-[17px] font-black text-gbe-text transition-[color,transform] duration-200 hover:-translate-y-[3px] hover:text-gbe-gold max-[1024px]:h-7 max-[1024px]:w-7 max-[1024px]:drop-shadow-[0_0_7px_rgba(255,255,255,0.42)] max-[560px]:h-6 max-[560px]:w-6 [&_svg]:h-[26px] [&_svg]:w-[26px] max-[1024px]:[&_svg]:h-[22px] max-[1024px]:[&_svg]:w-[22px] max-[560px]:[&_svg]:h-[19px] max-[560px]:[&_svg]:w-[19px]"
          key={label}
          href={href}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}
