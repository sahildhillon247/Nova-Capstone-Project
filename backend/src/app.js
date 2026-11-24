const express = require("express");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const problemsRoutes = require("./routes/problems.routes");
const progressRoutes = require("./routes/progress.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

// middlewares:-
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN || "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

// API routes:-
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);

// this one handles unknown routes:
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

module.exports = app;