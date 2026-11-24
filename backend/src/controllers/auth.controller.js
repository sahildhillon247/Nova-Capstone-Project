
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const localUsers = new Map();
let nextLocalUserId = 1;
const jwtSecret = process.env.JWT_SECRET || "nova-local-development-secret";

function generateToken(userId) {
    return jwt.sign(
        { userId },
        jwtSecret,
        { expiresIn: "7d" }
    );
}

function isLocalAuthEnabled() {
    return !process.env.DATABASE_URL;
}

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

// POST /api/auth/signup
async function signup(req, res) {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const { password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        let user;

        if (isLocalAuthEnabled()) {
            if (localUsers.has(email)) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists"
                });
            }

            user = {
                id: nextLocalUserId++,
                name: name.trim(),
                email,
                passwordHash,
                createdAt: new Date()
            };
            localUsers.set(email, user);
            console.warn("DATABASE_URL is not configured; using in-memory development auth.");
        } else {
            user = await prisma.user.create({
                data: {
                    name: name.trim(),
                    email,
                    passwordHash
                }
            });
        }

        const token = generateToken(user.id);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        console.error("Signup error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

// POST /api/auth/login
async function login(req, res) {
    try {
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = isLocalAuthEnabled()
            ? localUsers.get(email)
            : await prisma.user.findUnique({
                where: { email }
            });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user.id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

// GET /api/auth/me
async function getMe(req, res) {
    try {
        const user = isLocalAuthEnabled()
            ? [...localUsers.values()].find((candidate) => candidate.id === req.user.userId)
            : await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true
                }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

module.exports = { signup, login, getMe};
