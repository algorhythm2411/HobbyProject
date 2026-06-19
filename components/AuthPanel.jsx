"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500 disabled:opacity-60"
      />
    </label>
  );
}

export default function AuthPanel() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const clearStatus = () => {
    setError("");
    setMessage("");
  };

  async function handleGoogleSignIn() {
    clearStatus();
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  async function handleEmailSignIn(e) {
    e.preventDefault();
    clearStatus();
    setBusy(true);

    try {
      const res = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        callbackUrl: "/dashboard",
        redirect: true,
      });

      if (res?.error) {
        setError("Invalid email or password.");
      }
    } catch (err) {
      setError(err?.message || "Failed to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSignUp(e) {
    e.preventDefault();
    clearStatus();

    if (signupPassword !== signupConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/email/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          name: signupName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      setMessage("Account created. Check your email to confirm it.");
      setSignupPassword("");
      setSignupConfirm("");
    } catch (err) {
      setError(err?.message || "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Sign in</h3>
            <p className="text-sm text-slate-400">Use Google or your email password.</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
            Existing users
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100"
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Field
            label="Password"
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Your password"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign in with Email
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Sign up</h3>
            <p className="text-sm text-slate-400">Create your account with email and password.</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
            New users
          </span>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <form onSubmit={handleEmailSignUp} className="mt-5 space-y-4">
          <Field
            label="Email"
            type="email"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Field
            label="Display name"
            type="text"
            value={signupName}
            onChange={(e) => setSignupName(e.target.value)}
            placeholder="Optional"
          />
          <Field
            label="Password"
            type="password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            placeholder="Create password"
            required
          />
          <Field
            label="Retype password"
            type="password"
            value={signupConfirm}
            onChange={(e) => setSignupConfirm(e.target.value)}
            placeholder="Retype password"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}
