/*
  Warnings:

  - Made the column `assetSymbol` on table `Prediction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `predictedDirection` on table `Prediction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Prediction` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prediction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "assetSymbol" TEXT NOT NULL,
    "predictedDirection" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prediction_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prediction" ("assetSymbol", "createdAt", "id", "predictedDirection", "tournamentId", "userId") SELECT "assetSymbol", "createdAt", "id", "predictedDirection", "tournamentId", "userId" FROM "Prediction";
DROP TABLE "Prediction";
ALTER TABLE "new_Prediction" RENAME TO "Prediction";
CREATE UNIQUE INDEX "Prediction_userId_tournamentId_assetSymbol_key" ON "Prediction"("userId", "tournamentId", "assetSymbol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
