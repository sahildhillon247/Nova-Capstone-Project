
const prisma = require("../src/config/prisma");

const problems = [
    {
        title: "Two Sum",
        difficulty: "EASY",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/two-sum/",
        topics: ["Arrays", "Hashing"]
    },
    {
        title: "Best Time to Buy and Sell Stock",
        difficulty: "EASY",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        topics: ["Arrays", "Dynamic Programming"]
    },
    {
        title: "Binary Search",
        difficulty: "EASY",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/binary-search/",
        topics: ["Arrays", "Binary Search"]
    },
    {
        title: "Valid Parentheses",
        difficulty: "EASY",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/valid-parentheses/",
        topics: ["Strings", "Stacks"]
    },
    {
        title: "3Sum",
        difficulty: "MEDIUM",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/3sum/",
        topics: ["Arrays", "Two Pointers", "Sorting"]
    },
    {
        title: "Longest Substring Without Repeating Characters",
        difficulty: "MEDIUM",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        topics: ["Strings", "Hashing", "Sliding Window"]
    },
    {
        title: "Number of Islands",
        difficulty: "MEDIUM",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/number-of-islands/",
        topics: ["Graphs", "DFS", "BFS"]
    },
    {
        title: "Coin Change",
        difficulty: "MEDIUM",
        platform: "LeetCode",
        url: "https://leetcode.com/problems/coin-change/",
        topics: ["Dynamic Programming"]
    },
    
    {
        title: "Watermelon",
        difficulty: "EASY",
        platform: "Codeforces",
        url: "https://codeforces.com/problemset/problem/4/A",
        topics: ["Math"]
    },
    {
        title: "Way Too Long Words",
        difficulty: "EASY",
        platform: "Codeforces",
        url: "https://codeforces.com/problemset/problem/71/A",
        topics: ["Strings"]
    },
    {
        title: "Missing Number",
        difficulty: "EASY",
        platform: "CSES",
        url: "https://cses.fi/problemset/task/1083/",
        topics: ["Arrays", "Math"]
    },
    {
        title: "Repetitions",
        difficulty: "EASY",
        platform: "CSES",
        url: "https://cses.fi/problemset/task/1069/",
        topics: ["Strings"]
    },
    {
        title: "Increasing Array",
        difficulty: "EASY",
        platform: "CSES",
        url: "https://cses.fi/problemset/task/1094/",
        topics: ["Arrays", "Greedy"]
    },
    {
        title: "Dice Combinations",
        difficulty: "MEDIUM",
        platform: "CSES",
        url: "https://cses.fi/problemset/task/1633/",
        topics: ["Dynamic Programming"]
    }
];

async function main() {
    const platformMap = {};
    const topicMap = {};

    // Create platforms if they don't exist.
    for (const name of ["LeetCode", "Codeforces", "CSES"]) {
        platformMap[name] = await prisma.platform.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    // Create topics if they don't exist.
    const allTopics = [...new Set(problems.flatMap(p => p.topics))];

    for (const name of allTopics) {
        topicMap[name] = await prisma.topic.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    // Insert or update problems and their topic relations.
    for (const item of problems) {
        const platform = platformMap[item.platform];

        const existing = await prisma.problem.findFirst({
            where: {
                title: item.title,
                platformId: platform.id
            }
        });

        const topicConnections = item.topics.map(name => ({
            topic: {
                connect: { id: topicMap[name].id }
            }
        }));

        const data = {
            title: item.title,
            difficulty: item.difficulty,
            problemUrl: item.url,
            platform: {
                connect: { id: platform.id }
            }
        };

        if (existing) {
            await prisma.problem.update({
                where: { id: existing.id },
                data: {
                    ...data,
                    topics: {
                        deleteMany: {},
                        create: topicConnections
                    }
                }
            });
        } else {
            await prisma.problem.create({
                data: {
                    ...data,
                    topics: {
                        create: topicConnections
                    }
                }
            });
        }
    }

    console.log(`Seed completed: ${problems.length} problems processed.`);
}

main()
    .catch(error => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
