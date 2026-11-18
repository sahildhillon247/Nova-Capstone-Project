const prisma = require("../config/prisma");

// Mark a problem as solved
async function markProblemSolved(req, res) {
    try {
        const problemId = Number(req.params.problemId);
        const userId = req.user.userId;

        if (!Number.isInteger(problemId) || problemId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid problem ID"
            });
        }

        const problem = await prisma.problem.findUnique({
            where: { id: problemId }
        });

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        const progress = await prisma.userProgress.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId
                }
            },
            update: {
                status: "SOLVED",
                completedAt: new Date()
            },
            create: {
                userId,
                problemId,
                status: "SOLVED",
                startedAt: new Date(),
                completedAt: new Date()
            },
            include: {
                problem: {
                    include: {
                        platform: true,
                        topics: {
                            include: {
                                topic: true
                            }
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Problem marked as solved",
            data: { progress }
        });

    } catch (error) {
        console.error("Mark problem solved error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

// Get logged-in user's progress
async function getMyProgress(req, res) {
    try {
        const userId = req.user.userId;

        const progress = await prisma.userProgress.findMany({
            where: { userId },
            include: {
                problem: {
                    include: {
                        platform: true,
                        topics: {
                            include: {
                                topic: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                completedAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: progress.length,
            data: { progress }
        });

    } catch (error) {
        console.error("Get progress error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

module.exports = {
    markProblemSolved,
    getMyProgress
};