const express = require("express");

const {
    markProblemSolved,
    getMyProgress
} = require("../controllers/progress.controller");

const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

// All progress routes require authentication
router.use(authenticateToken);

router.patch("/:problemId", markProblemSolved);
router.get("/", getMyProgress);

module.exports = router;