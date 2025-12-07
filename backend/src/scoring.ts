import { prisma } from "./prisma";
import { computeScores } from "./data";

async function main() {
  const finished = await prisma.tournament.findMany({
    where: { status: "finished" },
    select: { id: true }
  });

  if (finished.length === 0) {
    console.log("No finished tournaments to score.");
    return;
  }

  for (const t of finished) {
    const results = await computeScores(String(t.id));
    console.log(`Computed scores for tournament ${t.id}`, results);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
