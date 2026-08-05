import { z } from "zod";

export const leadInsightSchema = z.object({
  opportunity: z.string().trim().min(1).max(240),
  risk: z.string().trim().min(1).max(240),
  evidence: z.array(z.string().trim().min(1).max(180)).min(1).max(5),
  recommendedNextAction: z.string().trim().min(1).max(240),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  caveat: z.string().trim().min(1).max(240),
});

export const messageDraftSchema = z.object({
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]),
  tone: z.enum(["CONCISE", "WARM", "FORMAL"]),
  draft: z.string().trim().min(1).max(1200),
  callToAction: z.string().trim().min(1).max(180),
  safetyNote: z.string().trim().min(1).max(180),
});

export const dailyBriefSchema = z.object({
  summary: z.string().trim().min(1).max(360),
  priorities: z.array(z.object({
    leadId: z.string().min(1), company: z.string().min(1).max(120), reason: z.string().min(1).max(180), action: z.string().min(1).max(180),
  })).max(6),
  risks: z.array(z.string().min(1).max(180)).max(6),
  wins: z.array(z.string().min(1).max(180)).max(6),
});

export type LeadInsight = z.infer<typeof leadInsightSchema>;
export type MessageDraft = z.infer<typeof messageDraftSchema>;
export type DailyBrief = z.infer<typeof dailyBriefSchema>;
