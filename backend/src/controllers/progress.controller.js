const prisma = require("../config/prisma");
const { localProblems, getSolvedSet } = require("../local-data");

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

        if (!process.env.DATABASE_URL) {
            const problem = localProblems.find((item) => item.id === problemId);
            if (!problem) {
                return res.status(404).json({
                    success: false,
                    message: "Problem not found"
                });
            }
            getSolvedSet(userId).add(problemId);
            return res.status(200).json({
                success: true,
                message: "Problem marked as solved",
                data: {
                    progress: {
                        problemId,
                        status: "SOLVED",
                        problem: { ...problem, solved: true }
                    }
                }
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
        const existingProgress = await prisma.userProgress.findUnique({
                where: {
                    userId_problemId: {
                        userId,
                        problemId
                    }
                },
                select: {
                    completedAt: true
                }
            });

        const completedAt = existingProgress?.completedAt || new Date();
        const progress = await prisma.userProgress.upsert({
            where: {
                userId_problemId: {
                    userId,
                    problemId
                }
            },
            update: {
                status: "SOLVED",
                completedAt: completedAt
            },
            create: {
                userId,
                problemId,
                status: "SOLVED",
                startedAt: new Date(),
                completedAt: completedAt
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

        if (!process.env.DATABASE_URL) {
            const solvedSet = getSolvedSet(userId);
            const progress = localProblems
                .filter((problem) => solvedSet.has(problem.id))
                .map((problem) => ({
                    problemId: problem.id,
                    status: "SOLVED",
                    problem: { ...problem, solved: true }
                }));

            return res.status(200).json({
                success: true,
                count: progress.length,
                data: { progress }
            });
        }

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