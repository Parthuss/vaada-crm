import { hash } from "bcryptjs";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed Vaada");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const email = (process.env.DEMO_EMAIL || "demo@vaada.app").toLowerCase();
const password = process.env.DEMO_PASSWORD || "VaadaDemo2026!";
const zone = "Asia/Kolkata";
const zonedAt = (offset: number, hour: number) => {
  const day = formatInTimeZone(addDays(new Date(), offset), zone, "yyyy-MM-dd");
  return fromZonedTime(`${day}T${String(hour).padStart(2, "0")}:00:00`, zone);
};

async function main() {
  const user = await db.user.upsert({ where: { email }, update: { name: "Aarav Mehta", passwordHash: await hash(password, 12) }, create: { name: "Aarav Mehta", email, passwordHash: await hash(password, 12) } });
  await db.aIRequest.deleteMany({ where: { ownerId: user.id } });
  await db.aIResult.deleteMany({ where: { ownerId: user.id } });
  await db.followUp.deleteMany({ where: { ownerId: user.id } });
  await db.lead.deleteMany({ where: { ownerId: user.id } });

  const seedLeads = [
    { name: "Neha Kulkarni", company: "Saffron Kitchens", email: "neha@example.com", phone: "+91 98765 43210", city: "Pune", industry: "Hospitality", source: "Referral", valuePaise: 420_000_00, status: "PROPOSAL" as const, notes: "Evaluating a 3-location rollout. Asked for a revised implementation timeline." },
    { name: "Rohan Shah", company: "Kite Logistics", email: "rohan@example.com", phone: "+91 98200 11223", city: "Ahmedabad", industry: "Logistics", source: "IndiaMART", valuePaise: 275_000_00, status: "QUALIFIED" as const, notes: "Operations lead is comparing two vendors. Speed of onboarding matters." },
    { name: "Aisha Khan", company: "Mitti Studio", email: "aisha@example.com", phone: "+91 99110 77554", city: "Jaipur", industry: "Retail", source: "Website", valuePaise: 120_000_00, status: "CONTACTED" as const, notes: "Interested in reducing manual customer follow-ups before festive season." },
    { name: "Vikram Iyer", company: "BluePeak Solar", email: "vikram@example.com", phone: "+91 98450 66221", city: "Bengaluru", industry: "Clean energy", source: "Trade event", valuePaise: 680_000_00, status: "NEW" as const, notes: "Met at SME Growth Summit. Team of twelve field salespeople." },
    { name: "Meera Bansal", company: "Nadi Wellness", email: "meera@example.com", phone: "+91 98188 44003", city: "Delhi", industry: "Wellness", source: "Partner", valuePaise: 310_000_00, status: "WON" as const, notes: "Pilot approved. Handoff to onboarding after contract countersignature." },
    { name: "Arjun Nair", company: "Cedar Learning", email: "arjun@example.com", phone: "+91 98950 33119", city: "Kochi", industry: "Education", source: "Outbound", valuePaise: 190_000_00, status: "LOST" as const, notes: "Paused budget until next quarter. Permission to reconnect in October." },
  ];
  const created = [];
  for (const lead of seedLeads) created.push(await db.lead.create({ data: { ...lead, ownerId: user.id } }));
  await db.followUp.createMany({ data: [
    { ownerId: user.id, leadId: created[0].id, kind: "WHATSAPP", dueAt: zonedAt(-2, 11), note: "Send revised rollout plan and confirm decision call" },
    { ownerId: user.id, leadId: created[1].id, kind: "CALL", dueAt: zonedAt(-1, 15), note: "Clarify warehouse integration questions" },
    { ownerId: user.id, leadId: created[2].id, kind: "EMAIL", dueAt: zonedAt(0, 16), note: "Share festive-season workflow examples" },
    { ownerId: user.id, leadId: created[3].id, kind: "CALL", dueAt: zonedAt(0, 17), note: "Book a discovery call with the field sales lead" },
    { ownerId: user.id, leadId: created[0].id, kind: "MEETING", dueAt: zonedAt(2, 12), note: "Review commercial proposal with operations" },
    { ownerId: user.id, leadId: created[4].id, kind: "EMAIL", dueAt: zonedAt(-3, 10), note: "Send onboarding introduction", completedAt: zonedAt(-3, 11) },
  ] });
  console.log(`Vaada demo seeded for ${email}`);
}

main().finally(() => db.$disconnect());
