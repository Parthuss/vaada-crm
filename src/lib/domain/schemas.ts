import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/domain/lead-status";

export const leadStatusSchema = z.enum(LEAD_STATUSES);

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter the contact name").max(120),
  company: z.string().trim().min(1, "Please enter the company name").max(120),
  email: z.string().trim().email("Enter an email such as name@example.com").optional().or(z.literal("")),
  phone: z.string().trim().regex(/^[+\d][\d\s()-]{6,19}$/, "Enter a valid phone number").optional().or(z.literal("")),
  city: optionalText(80),
  industry: optionalText(80),
  source: optionalText(80),
  valuePaise: z.preprocess(
    (value) => value === "" || value === null ? null : value,
    z.coerce.number().int().min(0).max(2_000_000_000).nullable().optional(),
  ),
  status: leadStatusSchema.default("NEW"),
  notes: optionalText(2000),
  updatedAt: z.coerce.date().optional(),
});

export const followUpInputSchema = z.object({
  leadId: z.string().min(1),
  kind: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING", "OTHER"]),
  dueAt: z.coerce.date(),
  note: z.string().trim().min(1, "Describe the promised next step").max(500),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type FollowUpInput = z.infer<typeof followUpInputSchema>;
