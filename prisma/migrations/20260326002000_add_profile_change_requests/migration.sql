CREATE TYPE "ProfileChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "ProfileChangeRequest" (
    "id" TEXT NOT NULL,
    "status" "ProfileChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "currentFullName" TEXT NOT NULL,
    "currentEmail" TEXT NOT NULL,
    "requestedFullName" TEXT NOT NULL,
    "requestedEmail" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "ProfileChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfileChangeRequest_requesterId_status_createdAt_idx" ON "ProfileChangeRequest"("requesterId", "status", "createdAt");

ALTER TABLE "ProfileChangeRequest"
ADD CONSTRAINT "ProfileChangeRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileChangeRequest"
ADD CONSTRAINT "ProfileChangeRequest_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
