import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";

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
});
