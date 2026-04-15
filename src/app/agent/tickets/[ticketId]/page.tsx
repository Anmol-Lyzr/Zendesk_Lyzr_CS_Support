import { notFound } from "next/navigation";
import { getTicket, tickets } from "@/lib/mockTickets";
import { AgentShell } from "@/app/agent/_components/AgentShell";
import { TicketList } from "@/app/agent/_components/TicketList";
import { TicketFieldsPanel } from "@/app/agent/_components/TicketFieldsPanel";
import { TicketHeader } from "@/app/agent/_components/TicketHeader";
import { ConversationThread } from "@/app/agent/_components/ConversationThread";
import { ReplyComposer } from "@/app/agent/_components/ReplyComposer";
import { LyzrPanel } from "@/app/agent/_components/LyzrPanel/LyzrPanel";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const ticket = getTicket(ticketId);

  if (!ticket) notFound();

  return (
    <AgentShell
      leftRail={<div />}
      leftPanel={<TicketFieldsPanel ticket={ticket} />}
      centerHeader={<TicketHeader ticket={ticket} />}
      center={
        <div className="flex min-h-0 flex-1 flex-col">
          <ConversationThread ticket={ticket} />
          <ReplyComposer ticket={ticket} />
        </div>
      }
      rightPanel={
        <LyzrPanel ticket={ticket} allTickets={tickets} />
      }
      topTabs={<TicketList selectedTicketId={ticket.id} tickets={tickets} />}
    />
  );
}

