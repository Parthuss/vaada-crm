-- AlterEnum
-- Positioned explicitly so the database's enum order matches the pipeline order. Prisma
-- appends to the end by default, which would leave NEGOTIATION sitting after LOST.
ALTER TYPE "LeadStatus" ADD VALUE 'NEGOTIATION' AFTER 'PROPOSAL';
