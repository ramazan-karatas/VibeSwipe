"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./prisma");
const data_1 = require("./data");
async function main() {
    const finished = await prisma_1.prisma.tournament.findMany({
        where: { status: "finished" },
        select: { id: true }
    });
    if (finished.length === 0) {
        console.log("No finished tournaments to score.");
        return;
    }
    for (const t of finished) {
        const results = await (0, data_1.computeScores)(String(t.id));
        console.log(`Computed scores for tournament ${t.id}`, results);
    }
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
