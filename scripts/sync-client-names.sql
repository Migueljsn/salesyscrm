UPDATE "Client" AS c
SET "name" = u."fullName",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "User" AS u
WHERE u."clientId" = c."id"
  AND u."role" = 'CLIENT'
  AND u."isActive" = true
  AND c."name" <> u."fullName";
