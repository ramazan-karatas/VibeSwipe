"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const data_1 = require("./data");
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
app.use("/api", routes_1.default);
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.listen(port, () => {
    console.log(`VibeSwipe backend listening on port ${port}`);
    // Simple in-process scheduler to score tournaments once they end.
    const intervalMs = 30 * 1000; // every 30 seconds
    setInterval(async () => {
        try {
            const results = await (0, data_1.scoreDueTournaments)();
            if (results.length > 0) {
                console.log("Auto-scored tournaments:", results);
            }
        }
        catch (err) {
            console.error("Auto-scoring failed:", err);
        }
    }, intervalMs);
});
