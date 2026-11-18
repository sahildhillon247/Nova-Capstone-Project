const express = require("express");

const { getDashboard } = require("../controllers/dashboard.controller");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", getDashboard);

module.exports = router;