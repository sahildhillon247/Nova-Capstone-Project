const prisma = require("../config/prisma");
const { localProblems, getSolvedSet } = require("../local-data");

async function getDashboard(req, res) {
    try {
        const userId = req.user.userId;

        if (!process.env.DATABASE_URL) {
            const solvedSet = getSolvedSet(userId);
            const solvedProblems = solvedSet.size;
            const totalProblems = localProblems.length;
            const topics = new Map();

            for (const problem of localProblems) {
                for (const { topic } of problem.topics) {
                    if (!topics.has(topic.id)) {
                        topics.set(topic.id, { topicId: topic.id, topicName: topic.name, totalProblems: 0, solvedProblems: 0 });
                    }
                    const topicProgress = topics.get(topic.id);
                    topicProgress.totalProblems += 1;
                    if (solvedSet.has(problem.id)) {
                        topicProgress.solvedProblems += 1;
                    }
                }
            }

            const topicProgress = [...topics.values()].map((topic) => ({
                ...topic,
                completionPercentage: topic.totalProblems > 0
                    ? Math.round((topic.solvedProblems / topic.totalProblems) * 100)
                    : 0
            }));

            return res.status(200).json({
                success: true,
                data: {
                    overview: {
                        totalProblems,
                        solvedProblems,
                        unsolvedProblems: totalProblems - solvedProblems,
                        completionPercentage: totalProblems > 0
                            ? Math.round((solvedProblems / totalProblems) * 100)
                            : 0
                    },
                    topicProgress,
                    weakAreas: [...topicProgress]
                        .sort((a, b) => a.completionPercentage - b.completionPercentage)
                        .slice(0, 3)
                }
            });
        }

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