CREATE TABLE "ClientSettings" (
    "id" TEXT NOT NULL,
    "leadCaptureKey" TEXT NOT NULL,
    "pixelId" TEXT,
    "metaAccessToken" TEXT,
    "metaTestEventCode" TEXT,
    "purchaseTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "ClientSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientSettings_leadCaptureKey_key" ON "ClientSettings"("leadCaptureKey");
CREATE UNIQUE INDEX "ClientSettings_clientId_key" ON "ClientSettings"("clientId");

ALTER TABLE "ClientSettings"
ADD CONSTRAINT "ClientSettings_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
