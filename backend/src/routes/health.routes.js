const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CodeNova backend is running!",
        data: {
            status: "healthy",
            service: "CodeNova API"
        }
    });
});

module.exports = router;