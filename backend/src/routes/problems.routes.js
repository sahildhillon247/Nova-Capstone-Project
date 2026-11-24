const express = require("express");
const authenticateToken = require("../middleware/auth.middleware");
const {
    getProblems,
    getProblem
} = require("../controllers/problems.controller");

const router = express.Router();

router.use(authenticateToken);
router.get("/", getProblems);
router.get("/:id", getProblem);

module.exports = router;
