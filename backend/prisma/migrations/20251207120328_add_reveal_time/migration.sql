-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "name" TEXT NOT NULL DEFAULT 'Tournament',
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryFee" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "revealTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" INTEGER,
    CONSTRAINT "Tournament_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("createdAt", "creatorId", "duration", "endTime", "entryFee", "id", "name", "startTime", "status", "updatedAt", "revealTime")
SELECT "createdAt", "creatorId", "duration", "endTime", "entryFee", "id", "name", "startTime", "status", "updatedAt", "endTime" AS "revealTime" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
