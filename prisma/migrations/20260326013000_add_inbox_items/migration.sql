CREATE TYPE "InboxItemType" AS ENUM ('PROFILE_CHANGE_PENDING', 'SALE_CONFIRMATION_PENDING', 'TRACKING_ERROR');

CREATE TYPE "InboxItemStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL,
    "type" "InboxItemType" NOT NULL,
    "audience" "UserRole" NOT NULL,
    "status" "InboxItemStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibleFrom" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,
    "saleId" TEXT,
    "profileChangeRequestId" TEXT,

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InboxItem_audience_status_createdAt_idx" ON "InboxItem"("audience", "status", "createdAt");
CREATE INDEX "InboxItem_clientId_audience_status_createdAt_idx" ON "InboxItem"("clientId", "audience", "status", "createdAt");
CREATE INDEX "InboxItem_type_status_createdAt_idx" ON "InboxItem"("type", "status", "createdAt");

ALTER TABLE "InboxItem"
ADD CONSTRAINT "InboxItem_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InboxItem"
ADD CONSTRAINT "InboxItem_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InboxItem"
ADD CONSTRAINT "InboxItem_saleId_fkey"
FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InboxItem"
ADD CONSTRAINT "InboxItem_profileChangeRequestId_fkey"
FOREIGN KEY ("profileChangeRequestId") REFERENCES "ProfileChangeRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
