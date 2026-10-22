import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../../../shared/api/client.js";
import { useAuth } from "../../../shared/auth/AuthContext.jsx";
import AuthCard from "../components/AuthCard.jsx";

const ERROR_COPY = {
  email_already_registered: "An account with this email already exists.",
  username_already_taken: "That username is already taken.",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username, email, password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(ERROR_COPY[err.code] ?? err.detail ?? "Registration failed.");
      } else {
        setError("Registration failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="CODEFORGE"
      subtitle="Found your village."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Username</span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={50}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-2 text-slate-100 outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-2 text-slate-100 outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-2 text-slate-100 outline-none focus:border-gold"
          />
          <span className="text-xs text-slate-500">At least 8 characters.</span>
        </label>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-md bg-gold px-4 py-2 font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
