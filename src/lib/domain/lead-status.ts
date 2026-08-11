import type { LeadStatus } from "@/generated/prisma/enums";

// The one ordered list of pipeline stages. Everything that renders a board column, a filter
// option or a status dropdown reads it from here, so adding a stage is a single edit plus a
// migration rather than a hunt through pages, routes and components.
//
// The import is type-only, so this module stays free of any runtime dependency and is safe to
// import from client components.
export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const satisfies readonly LeadStatus[];

// `satisfies` above rejects a value that isn't a real status. This rejects the opposite
// mistake: a status added to the Prisma enum but never listed here, which would otherwise
// fail silently at runtime as a missing column or a missing dropdown option.
type MissingFromList = Exclude<LeadStatus, (typeof LEAD_STATUSES)[number]>;
const _everyStatusIsListed: MissingFromList extends never ? true : never = true;
void _everyStatusIsListed;

// Stages that mean the deal is closed. Used to decide what counts as active pipeline.
export const CLOSED_STATUSES = ["WON", "LOST"] as const satisfies readonly LeadStatus[];

export const isClosedStatus = (status: string) =>
  (CLOSED_STATUSES as readonly string[]).includes(status);
