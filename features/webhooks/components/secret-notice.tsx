"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** Shows a freshly generated signing secret once, with a copy button. */
export function SecretNotice({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ block: "center" });
    panel.current?.focus({ preventScroll: true });
  }, [secret]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };
  return (
    <div ref={panel} tabIndex={-1} role="region" aria-label="New signing secret" className="flex flex-col gap-2 rounded-md border-2 border-primary bg-accent p-3 focus:outline-none focus:ring-2 focus:ring-ring">
      <p className="text-sm font-medium">Signing secret (shown once)</p>
      <p className="text-xs text-muted-foreground">Copy this secret into your receiver before leaving this page. It will not be shown again after a reload.</p>
      <code className="break-all rounded bg-card px-2 py-1 text-xs" aria-label="Signing secret">
        {secret}
      </code>
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={copy}>
        {copied ? "Copied" : "Copy secret"}
      </Button>
      {copyFailed && <p role="alert" className="text-xs">Clipboard unavailable. Select and copy the secret above manually.</p>}
    </div>
  );
}
