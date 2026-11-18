const prisma = require("../config/prisma");

async function getDashboard(req, res) {
    try {
        const userId = req.user.userId;

        // Get overall problem statistics
        const [totalProblems, solvedProblems, topics] = await Promise.all([
            prisma.problem.count(),

            prisma.userProgress.count({
                where: {
                    userId,
                    status: "SOLVED"
                }
            }),

            prisma.topic.findMany({
                select: {
                    id: true,
                    name: true,
                    problems: {
                        select: {
                            problem: {
                                select: {
                                    progress: {
                                        where: {
                                            userId,
                                            status: "SOLVED"
                                        },
                                        select: {
                                            userId: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        ]);

        // Calculate topic-wise progress
        const topicProgress = topics
            .map((topic) => {
                const total = topic.problems.length;

                const solved = topic.problems.filter(
                    (item) => item.problem.progress.length > 0
                ).length;

                return {
                    topicId: topic.id,
                    topicName: topic.name,
                    totalProblems: total,
                    solvedProblems: solved,
                    completionPercentage: total > 0
                        ? Math.round((solved / total) * 100)
                        : 0
                };
            })
            .filter((topic) => topic.totalProblems > 0);

        // Identify topics with the lowest completion
        const weakAreas = [...topicProgress]
            .sort((a, b) => {
                return a.completionPercentage - b.completionPercentage;
            })
            .slice(0, 3);

        const completionPercentage = totalProblems > 0
            ? Math.round((solvedProblems / totalProblems) * 100)
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalProblems,
                    solvedProblems,
                    unsolvedProblems: totalProblems - solvedProblems,
                    completionPercentage
                },
                topicProgress,
                weakAreas
            }
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

module.exports = { getDashboard };