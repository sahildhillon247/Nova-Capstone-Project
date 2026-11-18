const express = require("express");
const { signup, login, getMe } = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// Protected route
router.get("/me", authenticateToken, getMe);

module.exports = router;