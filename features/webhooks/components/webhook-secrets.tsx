"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Secrets = { secrets: Record<string, string>; publish: (id: string, secret: string) => void };
const Context = createContext<Secrets | null>(null);
/** Ephemeral, scope-local state only: never put signing secrets in URLs or browser storage. */
export function WebhookSecretsProvider({ children }: { children: ReactNode }) {
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const publish = useCallback((id: string, secret: string) => setSecrets(previous => ({ ...previous, [id]: secret })), []);
  const value = useMemo(() => ({ secrets, publish }), [secrets, publish]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useWebhookSecrets = () => useContext(Context);
