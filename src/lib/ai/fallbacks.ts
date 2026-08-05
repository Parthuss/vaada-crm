import type { DailyBrief, LeadInsight, MessageDraft } from "@/lib/ai/schemas";

type Lead = { id: string; name: string; company: string; status: string; followUps?: Array<{ dueAt: Date; completedAt: Date | null; note: string }> };

export function leadInsightFallback(lead: Lead): LeadInsight {
  const next = lead.followUps?.find((item) => !item.completedAt);
  return { opportunity: `${lead.company} is currently in the ${lead.status.toLowerCase()} stage.`, risk: next ? "The next commitment needs timely follow-through." : "No open follow-up is scheduled.", evidence: [`Pipeline stage: ${lead.status}`, next ? `Open follow-up: ${next.note}` : "No open follow-up"], recommendedNextAction: next ? `Complete the next follow-up by ${next.dueAt.toLocaleDateString("en-IN")}.` : "Schedule a specific next step with a due date.", confidence: "LOW", caveat: "Gemini was unavailable, so this is a rules-based fallback using CRM fields only." };
}

export function messageFallback(lead: Lead, channel: "WHATSAPP" | "SMS" | "EMAIL" = "WHATSAPP"): MessageDraft {
  const firstName = lead.name.split(/\s+/)[0];
  return { channel, tone: "WARM", draft: `Hi ${firstName}, just checking in on our conversation. Would a quick call this week be useful to agree on the next step?`, callToAction: "Ask for a convenient time for a short call.", safetyNote: "Rules-based fallback—review names, context, and commitments before sending." };
}

export function dailyBriefFallback(leads: Lead[]): DailyBrief {
  const priorities = leads.slice(0, 5).map((lead) => ({ leadId: lead.id, company: lead.company, reason: lead.followUps?.some((item) => !item.completedAt && item.dueAt < new Date()) ? "An open follow-up is overdue." : "This lead has an open next step.", action: lead.followUps?.find((item) => !item.completedAt)?.note ?? "Schedule a specific next step." }));
  return { summary: `${priorities.length} lead${priorities.length === 1 ? "" : "s"} need attention based on current CRM data.`, priorities, risks: priorities.length ? ["Delayed follow-ups can weaken active conversations."] : [], wins: ["Your brief remains available even while Gemini is unavailable."] };
}
