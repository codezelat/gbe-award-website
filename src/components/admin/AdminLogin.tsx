import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Trophy } from "lucide-react";
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
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 size-[620px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,176,1,0.07),transparent_60%)] blur-2xl" />
      </div>

      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0c0c0e] p-12 lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/4 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,176,1,0.06),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:44px_44px]" />

        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-b from-[#ffc424] to-[#f59e0b] text-[#1a1206] shadow-[0_6px_20px_-6px_rgba(245,158,11,0.7)]">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-tight text-zinc-100">
              GBE Awards
            </p>
            <p className="text-xs font-medium text-zinc-500">Admin Console</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[clamp(34px,3.4vw,46px)] font-extrabold leading-[1.08] tracking-tight text-zinc-50"
          >
            Manage the Global Business Excellence Awards.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-[15px] leading-relaxed text-zinc-400"
          >
            A private workspace to curate past winners, review nominations, and
            keep the public showcase accurate across the UK, Sri Lanka, and
            international markets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex items-center gap-2.5 text-sm text-zinc-500"
          >
            <ShieldCheck size={16} className="text-emerald-400/80" />
            Protected session &middot; all changes are audited
          </motion.div>
        </div>

        <p className="relative text-xs text-zinc-600">
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
          <div className="mb-8 lg:hidden">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-gradient-to-b from-[#ffc424] to-[#f59e0b] text-[#1a1206]">
              <Trophy size={22} />
            </div>
            <p className="text-sm font-semibold text-zinc-400">GBE Admin Console</p>
          </div>

          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb001]/10 px-3 py-1 text-xs font-semibold text-[#ffd05a] ring-1 ring-inset ring-[#ffb001]/25">
              <Lock size={12} />
              Restricted access
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-50">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              Sign in with your administrator credentials to continue.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
              {submitting ? "Signing in..." : "Sign in to dashboard"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-zinc-600">
            Authorised administrators only. Unauthorised access is prohibited
            and monitored.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
