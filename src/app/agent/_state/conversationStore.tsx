"use client";

import * as React from "react";
import type { Message } from "@/lib/mockTickets";

type ConversationState = {
  messagesByTicketId: Record<string, Message[] | undefined>;
  appendMessage: (ticketId: string, message: Message) => void;
  clearTicketMessages: (ticketId: string) => void;
};

const ConversationContext = React.createContext<ConversationState | null>(null);

export function ConversationStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messagesByTicketId, setMessagesByTicketId] = React.useState<
    Record<string, Message[] | undefined>
  >({});

  const appendMessage = React.useCallback((ticketId: string, message: Message) => {
    setMessagesByTicketId((prev) => {
      const existing = prev[ticketId] ?? [];
      return { ...prev, [ticketId]: [...existing, message] };
    });
  }, []);

  const clearTicketMessages = React.useCallback((ticketId: string) => {
    setMessagesByTicketId((prev) => {
      if (!prev[ticketId]) return prev;
      const next = { ...prev };
      delete next[ticketId];
      return next;
    });
  }, []);

  const state = React.useMemo(
    () => ({ messagesByTicketId, appendMessage, clearTicketMessages }),
    [messagesByTicketId, appendMessage, clearTicketMessages]
  );

  return (
    <ConversationContext.Provider value={state}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversationStore() {
  const ctx = React.useContext(ConversationContext);
  if (!ctx) {
    throw new Error(
      "useConversationStore must be used within ConversationStoreProvider"
    );
  }
  return ctx;
}

