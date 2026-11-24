const prisma = require("../config/prisma");
const { localProblems, getSolvedSet } = require("../local-data");

function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function getProblems(req, res) {
    try {
        if (!process.env.DATABASE_URL) {
            const search = String(req.query.search || "").trim().toLowerCase();
            const difficulty = String(req.query.difficulty || "").toUpperCase();
            const topic = String(req.query.topic || "").toLowerCase();
            const solved = getSolvedSet(req.user.userId);
            const problems = localProblems
                .filter((problem) => !search || problem.title.toLowerCase().includes(search))
                .filter((problem) => !difficulty || problem.difficulty === difficulty)
                .filter((problem) => !topic || problem.topics.some(({ topic: item }) => item.name.toLowerCase() === topic));

            return res.status(200).json({
                success: true,
                data: {
                    problems: problems.map((problem) => ({
                        ...problem,
                        solved: solved.has(problem.id)
                    }))
                },
                pagination: { page: 1, limit: problems.length, total: problems.length, totalPages: 1 }
            });
        }
        const page = parsePositiveInteger(req.query.page, 1);
        const limit = Math.min(parsePositiveInteger(req.query.limit, 10), 100);
        const { search = "", difficulty = "", topic = "", platform = "" } = req.query;

        const where = {};

        if (typeof search === "string" && search.trim()) {
            where.title = { contains: search.trim(), mode: "insensitive" };
        }
        if (["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
            where.difficulty = difficulty;
        }
        if (typeof platform === "string" && platform.trim()) {
            where.platform = { name: { equals: platform.trim(), mode: "insensitive" } };
        }
        if (typeof topic === "string" && topic.trim()) {
            where.topics = {
                some: {
                    topic: { name: { equals: topic.trim(), mode: "insensitive" } }
                }
            };
        }

        const [problems, total] = await Promise.all([
            prisma.problem.findMany({
                where,
                include: {
                    platform: true,
                    topics: { include: { topic: true } }
                },
                orderBy: { id: "asc" },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.problem.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: { problems },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get problems error:", error);
        return res.status(500).json({ success: false, message: "Unable to load problems" });
    }
}

async function getProblem(req, res) {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ success: false, message: "Invalid problem id" });
        }

        if (!process.env.DATABASE_URL) {
            const problem = localProblems.find((item) => item.id === id);
            if (!problem) {
                return res.status(404).json({ success: false, message: "Problem not found" });
            }
            return res.status(200).json({
                success: true,
                data: { problem: { ...problem, solved: getSolvedSet(req.user.userId).has(id) } }
            });
        }

        const problem = await prisma.problem.findUnique({
            where: { id },
            include: {
                platform: true,
                topics: { include: { topic: true } }
            }
        });

        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }

        return res.status(200).json({
            success: true,
            data: { problem }
        });
    } catch (error) {
        console.error("Get problem error:", error);
        return res.status(500).json({ success: false, message: "Unable to load problem" });
    }
}

module.exports = { getProblems, getProblem };
