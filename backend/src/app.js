const express = require("express");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const problemRoutes = require("./routes/problem.routes");
const progressRoutes = require("./routes/progress.routes");

const app = express();

// middlewares:-
app.use(express.json());

// API routes:-
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/progress", progressRoutes);

// this one handles unknown routes:
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

module.exports = app;