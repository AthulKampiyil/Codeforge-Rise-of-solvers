// The Codeforces link -> copy token -> verify -> first sync flow
// (SRS 5.4: <=5 steps, under 5 minutes). All endpoints already exist
// on the backend (REQ-1.3, REQ-1.4) — this page just walks the user
// through them with a visible step counter.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../../shared/api/client.js";
import { getMyJudgeAccounts, requestJudgeLink, verifyJudgeAccount } from "../api/authApi.js";

const TOTAL_STEPS = 3;

function StepCounter({ step }) {
  return (
    <p className="text-xs uppercase tracking-wide text-slate-500">
      Step {step} of {TOTAL_STEPS}
    </p>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [handle, setHandle] = useState("");
  const [judgeAccount, setJudgeAccount] = useState(null);
  const [verificationToken, setVerificationToken] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Already linked and verified (e.g. revisiting this page)? Skip straight to done.
  useEffect(() => {
    getMyJudgeAccounts()
      .then((accounts) => {
        const verified = accounts.find((a) => a.judge_type === "codeforces" && a.verified_flag);
        if (verified) {
          setJudgeAccount(verified);
          setStep(3);
        }
      })
      .catch(() => {})
      .finally(() => setIsChecking(false));
  }, []);

  async function handleLinkSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await requestJudgeLink("codeforces", handle);
      setJudgeAccount(data.judge_account);
      setVerificationToken(data.verification_token);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail ?? "Couldn't link that handle." : "Couldn't link that handle.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await verifyJudgeAccount(judgeAccount.id);
      setJudgeAccount(data.judge_account);
      setStep(3);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail ?? "Verification failed — double-check your profile name and try again."
          : "Verification failed — double-check your profile name and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return <div className="flex h-full items-center justify-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-xl">
        <StepCounter step={step} />
        <h1 className="mt-1 font-display text-2xl text-slate-100">Link your Codeforces account</h1>

        {step === 1 && (
          <form onSubmit={handleLinkSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Codeforces handle</span>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="tourist"
                className="rounded-md border border-border bg-bg px-3 py-2 text-slate-100 outline-none focus:border-gold"
              />
            </label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-gold px-4 py-2 font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Linking…" : "Continue"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-slate-300">
              Set your Codeforces profile <strong>First Name</strong> to the token below, then come back
              and verify.
            </p>
            <code className="break-all rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm text-gold">
              {verificationToken}
            </code>
            <a
              href={`https://codeforces.com/settings/social`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-info hover:underline"
            >
              Open Codeforces profile settings ↗
            </a>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <button
              type="button"
              onClick={handleVerify}
              disabled={isSubmitting}
              className="rounded-md bg-gold px-4 py-2 font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Verifying…" : "I've updated it — Verify"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-success">
              Verified! Your village is syncing your Codeforces solves now.
            </p>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="rounded-md bg-gold px-4 py-2 font-medium text-bg transition-opacity hover:opacity-90"
            >
              Go to your village
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
