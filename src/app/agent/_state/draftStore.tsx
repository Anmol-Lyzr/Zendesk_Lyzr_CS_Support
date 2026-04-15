"use client";

import * as React from "react";

type DraftState = {
  draftByTicketId: Record<string, string | undefined>;
  setDraft: (ticketId: string, value: string) => void;
  fillDraftIfEmpty: (ticketId: string, value: string) => void;
};

const DraftContext = React.createContext<DraftState | null>(null);

export function DraftStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draftByTicketId, setDraftByTicketId] = React.useState<
    Record<string, string | undefined>
  >({});

  const setDraft = React.useCallback((ticketId: string, value: string) => {
    setDraftByTicketId((prev) => ({ ...prev, [ticketId]: value }));
  }, []);

  const fillDraftIfEmpty = React.useCallback(
    (ticketId: string, value: string) => {
      setDraftByTicketId((prev) => {
        const current = prev[ticketId];
        if (current && current.trim().length > 0) return prev;
        return { ...prev, [ticketId]: value };
      });
    },
    []
  );

  const state = React.useMemo(
    () => ({ draftByTicketId, setDraft, fillDraftIfEmpty }),
    [draftByTicketId, setDraft, fillDraftIfEmpty]
  );

  return (
    <DraftContext.Provider value={state}>{children}</DraftContext.Provider>
  );
}

export function useDraftStore() {
  const ctx = React.useContext(DraftContext);
  if (!ctx) {
    throw new Error("useDraftStore must be used within DraftStoreProvider");
  }
  return ctx;
}

