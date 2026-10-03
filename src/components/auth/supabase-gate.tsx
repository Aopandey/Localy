"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Leaf, LockKeyhole, ArrowRight } from "lucide-react";
import { getSupabase, getSupabaseConfigError } from "@/lib/supabase/client";
import { isSupabaseMode } from "@/services/api";
import { Button, LoadingState } from "@/components/ui/primitives";

export function SupabaseGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(isSupabaseMode);
  const [error, setError] = useState<string | null>(null);
  const configError = isSupabaseMode ? getSupabaseConfigError() : null;
  useEffect(() => {
    if (!isSupabaseMode || configError) return;
    const client = getSupabase();
    let active = true;
    // Register first so a login/logout cannot be missed during the initial request.
    const { data: listener } = client.auth.onAuthStateChange(
      (_event, value) => {
        if (active) {
          setSession(value);
          setChecking(false);
        }
      },
    );
    client.auth
      .getSession()
      .then(({ data, error: authError }) => {
        if (!active) return;
        setSession(data.session);
        setChecking(false);
        if (authError)
          setError("Could not restore your sign-in. Please sign in again.");
      })
      .catch(() => {
        if (active) {
          setError("Could not reach your workspace. Please try again.");
          setChecking(false);
        }
      });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [configError]);
  if (!isSupabaseMode) return children;
  if (configError)
    return (
      <AuthFrame>
        <h1>Finish connecting your workspace</h1>
        <p>{configError}</p>
        <p className="auth-hint">
          The setup steps are in supabase/SETUP.md in your project folder.
        </p>
      </AuthFrame>
    );
  if (checking)
    return (
      <AuthFrame>
        <LoadingState />
      </AuthFrame>
    );
  if (!session) return <SignIn initialError={error} />;
  return <div key={session.user.id}>{children}</div>;
}
function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-card card">
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={23} />
          </span>
          <span>
            localy<span className="brand-dot">.</span>
          </span>
        </div>
        {children}
      </div>
      <p className="auth-tagline">Turn local conversations into customers.</p>
    </main>
  );
}
function SignIn({ initialError }: { initialError: string | null }) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const auth = getSupabase().auth;
      const result = signup
        ? await auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) throw result.error;
      if (signup && !result.data.session)
        setMessage(
          "Check your email to confirm your account, then sign in. Your workspace owner must also grant access.",
        );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <span className="auth-private">
        <LockKeyhole size={13} />
        PRIVATE WORKSPACE
      </span>
      <h1>
        {signup ? "Create your Localy account" : "Welcome back to Localy"}
      </h1>
      <p>Sign in to see your community posts and opportunities.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={signup ? 8 : 1}
            autoComplete={signup ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <div className="auth-alert" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
          <ArrowRight size={16} />
        </Button>
      </form>
      <Button
        variant="ghost"
        type="button"
        onClick={() => {
          setSignup(!signup);
          setError(null);
          setMessage(null);
        }}
      >
        {signup
          ? "Already have a Localy account? Sign in"
          : "First time here? Create a Localy account"}
      </Button>
      <p className="auth-hint">
        Access is limited to people approved by the workspace owner.
      </p>
    </AuthFrame>
  );
}
