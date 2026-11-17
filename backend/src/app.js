const express = require("express");
const healthRoutes = require("./routes/health.routes");

const app = express();

// middlewares:-
app.use(express.json());

// API routes:-
app.use("/api/health", healthRoutes);

// this one handles unknown routes:
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

module.exports = app;