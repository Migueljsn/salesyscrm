DROP TABLE IF EXISTS "SaleConfirmationLink";

DROP TYPE IF EXISTS "ConfirmationLinkStatus";

DELETE FROM "InboxItem"
WHERE "type" = 'SALE_CONFIRMATION_PENDING';

ALTER TYPE "InboxItemType" RENAME TO "InboxItemType_old";

CREATE TYPE "InboxItemType" AS ENUM (
  'PROFILE_CHANGE_PENDING',
  'TRACKING_ERROR',
  'FOLLOW_UP_DUE'
);

ALTER TABLE "InboxItem"
  ALTER COLUMN "type" TYPE "InboxItemType"
  USING ("type"::text::"InboxItemType");

DROP TYPE "InboxItemType_old";
