ALTER TABLE "Sale"
ADD COLUMN "trackingStatus" TEXT,
ADD COLUMN "trackingSentAt" TIMESTAMP(3),
ADD COLUMN "trackingError" TEXT,
ADD COLUMN "trackingResponse" JSONB;
