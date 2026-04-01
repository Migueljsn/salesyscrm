ALTER TABLE "ProfileChangeRequest"
ADD COLUMN "requestedPasswordEncrypted" TEXT,
ADD COLUMN "requestsPasswordChange" BOOLEAN NOT NULL DEFAULT false;
