"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TryDemo() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn-primary"
        disabled={busy}
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
        {busy ? "Opening" : "Open the demo"}
      </button>
      {error && (
        <span role="alert" className="text-[13px] text-error">
          {error}
        </span>
      )}
    </span>
  );
}
