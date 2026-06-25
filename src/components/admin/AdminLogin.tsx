import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button, cn } from "./ui";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error?.message ??
            "Invalid credentials. Please check your email and password.",
        );
      }
      setPassword("");
      window.location.href = "/gbe-admin-safe/overview";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden flex-col items-center justify-center overflow-hidden border-r border-white/[0.06] bg-[#0c0c0e] p-12 lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/4 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,176,1,0.06),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:44px_44px]" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center text-center"
        >
          <img
            className="mb-8 h-[88px] w-auto object-contain"
            src="/assets/brand/gbe-logo.png"
            alt="GBE Awards"
            width="60"
            height="92"
            decoding="async"
          />
          <p className="text-[clamp(28px,3vw,40px)] font-extrabold leading-[1.1] tracking-tight text-zinc-50">
            Global Business
            <br />
            Excellence Awards
          </p>
          <p className="mt-4 text-[15px] font-medium text-[#ffd05a]">
            2026 &middot; Admin Console
          </p>
        </motion.div>

        <p className="relative mt-16 text-xs text-zinc-600">
          &copy; 2026 London Business Consultancy
        </p>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center px-5 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <img
              className="mb-3 h-[64px] w-auto object-contain"
              src="/assets/brand/gbe-logo.png"
              alt="GBE Awards"
              width="44"
              height="68"
              decoding="async"
            />
            <p className="text-sm font-semibold text-zinc-400">Admin Console</p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-zinc-50">
            Sign in
          </h2>

          <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e0e11] pl-10 pr-3.5 text-[15px] text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-[#ffb001]/55 focus:ring-2 focus:ring-[#ffb001]/18"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gbeaward.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e0e11] pl-10 pr-10 text-[15px] text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-[#ffb001]/55 focus:ring-2 focus:ring-[#ffb001]/18"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-2.5 text-[13px] font-medium text-rose-300">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              icon={!submitting ? ArrowRight : undefined}
              className={cn("mt-1 w-full", !submitting && "flex-row-reverse")}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
