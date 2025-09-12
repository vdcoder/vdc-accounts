"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex flex-col items-center justify-center font-sans">
      <form
        onSubmit={handleSubmit}
        className="bg-background/80 shadow-card rounded-2xl px-8 py-10 w-full max-w-sm flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold text-primary mb-2">Login</h1>
        <p className="text-foreground/70 mb-6 text-center text-sm">Enter your password to access your personal hub.</p>
        <input
          type="password"
          className="w-full px-4 py-2 rounded-lg border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4 bg-white/80 text-foreground text-base"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
          autoFocus
        />
        {error && <div className="text-red-500 text-xs mb-3">{error}</div>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-primary to-blue-400 text-white font-semibold py-2 rounded-lg shadow hover:from-blue-500 hover:to-primary transition-colors disabled:opacity-60"
          disabled={loading || !password}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
