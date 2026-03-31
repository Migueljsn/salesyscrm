ALTER TABLE "Lead"
ADD COLUMN "isQualified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "qualifiedAt" TIMESTAMP(3),
ADD COLUMN "qualifiedMetaEventId" TEXT,
ADD COLUMN "qualifiedTrackingStatus" TEXT,
ADD COLUMN "qualifiedTrackingSentAt" TIMESTAMP(3),
ADD COLUMN "qualifiedTrackingError" TEXT,
ADD COLUMN "qualifiedTrackingResponse" JSONB,
ADD COLUMN "qualifiedById" TEXT;

CREATE UNIQUE INDEX "Lead_qualifiedMetaEventId_key" ON "Lead"("qualifiedMetaEventId");

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_qualifiedById_fkey"
FOREIGN KEY ("qualifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
