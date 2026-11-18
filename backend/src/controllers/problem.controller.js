const prisma = require("../config/prisma");

async function getAllProblems(req, res) {
    try {
       const { difficulty,topic,platform,search } = req.query;
       const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;
       const validDifficulties = ["EASY", "MEDIUM", "HARD"];

        if (difficulty && !validDifficulties.includes(difficulty.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid difficulty. Use EASY, MEDIUM, or HARD."
            });
        }
        const where = {
                ...(difficulty && {
                    difficulty: difficulty.toUpperCase()
                }),
                ...(topic && {
                    topics: {
                        some: {
                            topic: {
                                name: {
                                    equals: topic,
                                    mode: "insensitive"
                                }
                            }
                        }
                    }
                }),
                ...(platform && {
                    platform: {
                        is: {
                            name: {
                                equals: platform,
                                mode: "insensitive"
                            }
                        }
                    }
                }),
                ...(search && {
                    title: {
                        contains: search,
                        mode: "insensitive"
                    }
                })
            };

    const [problems, total] = await Promise.all([
    prisma.problem.findMany({
        where,
        skip,
        take: limit,
        include: {
            platform: true,
            topics: {
                include: {
                    topic: true
                }
            }
        }
    }),
    prisma.problem.count({ where })
]);

        return res.status(200).json({
    success: true,
    count: total,
    pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    },
    data: { problems }
});
    } catch (error) {
        console.error("Get problems error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

async function getProblemById(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid problem ID"
            });
        }

        const problem = await prisma.problem.findUnique({
            where: { id },
            include: {
                platform: true,
                topics: {
                    include: {
                        topic: true
                    }
                }
            }
        });

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: { problem }
        });
    } catch (error) {
        console.error("Get problem error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}

module.exports = { getAllProblems, getProblemById };