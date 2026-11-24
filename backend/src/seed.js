require("dotenv").config();

const prisma = require("./config/prisma");

const topics = [
    "Arrays",
    "Strings",
    "Dynamic Programming",
    "Graphs",
    "Math",
    "Hashing",
    "Binary Search",
    "Stacks",
    "Two Pointers",
    "Sorting",
    "Sliding Window",
    "DFS",
    "BFS",
    "Greedy"
];

const platforms = ["LeetCode", "Codeforces", "CSES"];

const seedProblems = [
    ["Two Sum", "EASY", "https://leetcode.com/problems/two-sum/", "LeetCode", ["Arrays", "Hashing"]],
    ["Valid Parentheses", "EASY", "https://leetcode.com/problems/valid-parentheses/", "LeetCode", ["Stacks"]],
    ["Binary Search", "EASY", "https://leetcode.com/problems/binary-search/", "LeetCode", ["Binary Search", "Arrays"]],
    ["Longest Common Subsequence", "MEDIUM", "https://leetcode.com/problems/longest-common-subsequence/", "LeetCode", ["Dynamic Programming", "Strings"]],
    ["Longest Substring Without Repeating Characters", "MEDIUM", "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "LeetCode", ["Strings", "Sliding Window", "Hashing"]],
    ["3Sum", "MEDIUM", "https://leetcode.com/problems/3sum/", "LeetCode", ["Arrays", "Two Pointers", "Sorting"]],
    ["Merge Intervals", "MEDIUM", "https://leetcode.com/problems/merge-intervals/", "LeetCode", ["Arrays", "Sorting"]],
    ["Course Schedule", "MEDIUM", "https://leetcode.com/problems/course-schedule/", "LeetCode", ["Graphs", "DFS", "BFS"]],
    ["Number of Islands", "MEDIUM", "https://leetcode.com/problems/number-of-islands/", "LeetCode", ["Graphs", "DFS", "BFS"]],
    ["Climbing Stairs", "EASY", "https://leetcode.com/problems/climbing-stairs/", "LeetCode", ["Dynamic Programming", "Math"]],
    ["Coin Change", "MEDIUM", "https://leetcode.com/problems/coin-change/", "LeetCode", ["Dynamic Programming", "Arrays"]],
    ["Largest Rectangle in Histogram", "HARD", "https://leetcode.com/problems/largest-rectangle-in-histogram/", "LeetCode", ["Stacks", "Arrays"]],
    ["Word Ladder", "HARD", "https://leetcode.com/problems/word-ladder/", "LeetCode", ["Graphs", "BFS"]],
    ["Watermelon", "EASY", "https://codeforces.com/problemset/problem/4/A", "Codeforces", ["Math", "Greedy"]],
    ["Weird Algorithm", "MEDIUM", "https://cses.fi/problemset/task/1068", "CSES", ["Math"]],
    ["Missing Number", "EASY", "https://cses.fi/problemset/task/1083", "CSES", ["Math", "Arrays"]]
];

async function seed() {
    for (const name of topics) {
        await prisma.topic.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    for (const name of platforms) {
        await prisma.platform.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    for (const [title, difficulty, problemUrl, platformName, topicNames] of seedProblems) {
        const platform = await prisma.platform.findUnique({ where: { name: platformName } });
        const topicRecords = await Promise.all(
            topicNames.map((name) => prisma.topic.findUnique({ where: { name } }))
        );

        const existing = await prisma.problem.findFirst({
            where: { title, problemUrl }
        });

        if (existing) {
            await prisma.problem.update({
                where: { id: existing.id },
                data: {
                    difficulty,
                    platformId: platform.id,
                    topics: {
                        deleteMany: {},
                        create: topicRecords
                            .filter(Boolean)
                            .map((topic) => ({ topic: { connect: { id: topic.id } } }))
                    }
                }
            });
        } else {
            await prisma.problem.create({
                data: {
                    title,
                    difficulty,
                    problemUrl,
                    platformId: platform.id,
                    topics: {
                        create: topicRecords
                            .filter(Boolean)
                            .map((topic) => ({ topic: { connect: { id: topic.id } } }))
                    }
                }
            });
        }
    }

    console.log("Nova problem library seeded successfully.");
}

seed()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
