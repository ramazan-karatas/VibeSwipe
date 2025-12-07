import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import { scoreDueTournaments } from "./data";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`VibeSwipe backend listening on port ${port}`);

  // Simple in-process scheduler to score tournaments once they end.
  const intervalMs = 30 * 1000; // every 30 seconds
  setInterval(async () => {
    try {
      const results = await scoreDueTournaments();
      if (results.length > 0) {
        console.log("Auto-scored tournaments:", results);
      }
    } catch (err) {
      console.error("Auto-scoring failed:", err);
    }
  }, intervalMs);
});
