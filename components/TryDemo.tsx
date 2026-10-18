"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TryDemo({ className = "btn btn-primary", wrapClassName = "" }: { className?: string; wrapClassName?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className={`flex flex-col items-stretch gap-1 ${wrapClassName}`}>
      <button
        type="button"
        className={className}
        disabled={busy}
        data-busy={busy || undefined}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/demo/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ who: "free" }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error ?? "Could not open the demo");
            router.push(data.redirect ?? "/dashboard");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not open the demo");
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening" : "Open the demo board"}
      </button>
      {error && (
        <span role="alert" className="t-small text-stamp-lit">
          {error}
        </span>
      )}
    </span>
  );
}
