type LeadForAi = {
  id: string; name: string; company: string; phone?: string | null; email?: string | null; city?: string | null;
  industry?: string | null; source?: string | null; status: string; valuePaise?: number | null; notes?: string | null;
  followUps?: Array<{ kind: string; note: string; dueAt: Date; completedAt: Date | null }>;
};

function sanitizeText(value: string | null | undefined, max: number) {
  return (value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function buildLeadContext(lead: LeadForAi) {
  return {
    leadId: lead.id,
    company: sanitizeText(lead.company, 120),
    city: sanitizeText(lead.city, 80),
    industry: sanitizeText(lead.industry, 80),
    source: sanitizeText(lead.source, 80),
    status: lead.status,
    valueBand: lead.valuePaise == null ? "UNKNOWN" : lead.valuePaise < 5_000_000 ? "UNDER_50K_INR" : lead.valuePaise < 25_000_000 ? "50K_TO_250K_INR" : "OVER_250K_INR",
    notes: sanitizeText(lead.notes, 600),
    recentFollowUps: (lead.followUps ?? []).slice(0, 6).map((item) => ({
      kind: item.kind,
      note: sanitizeText(item.note, 180),
      dueAt: item.dueAt.toISOString(),
      completed: Boolean(item.completedAt),
    })),
  };
}

export function buildMessageContext(lead: LeadForAi) {
  return { ...buildLeadContext(lead), firstName: sanitizeText(lead.name, 120).split(/\s+/)[0] };
}
