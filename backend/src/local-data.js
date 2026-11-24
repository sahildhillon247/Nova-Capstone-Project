const localProblems = [
    { id: 1, title: "Two Sum", difficulty: "EASY", problemUrl: "https://leetcode.com/problems/two-sum/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 1, name: "Arrays" } }] },
    { id: 2, title: "Valid Parentheses", difficulty: "EASY", problemUrl: "https://leetcode.com/problems/valid-parentheses/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 6, name: "Stacks" } }] },
    { id: 3, title: "Binary Tree Inorder Traversal", difficulty: "MEDIUM", problemUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 2, name: "Trees" } }] },
    { id: 4, title: "Number of Islands", difficulty: "MEDIUM", problemUrl: "https://leetcode.com/problems/number-of-islands/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 3, name: "Graphs" } }] },
    { id: 5, title: "Climbing Stairs", difficulty: "MEDIUM", problemUrl: "https://leetcode.com/problems/climbing-stairs/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 4, name: "Dynamic Programming" } }] },
    { id: 6, title: "Longest Common Subsequence", difficulty: "MEDIUM", problemUrl: "https://leetcode.com/problems/longest-common-subsequence/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 4, name: "Dynamic Programming" } }] },
    { id: 7, title: "Course Schedule", difficulty: "MEDIUM", problemUrl: "https://leetcode.com/problems/course-schedule/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 3, name: "Graphs" } }] },
    { id: 8, title: "Largest Rectangle in Histogram", difficulty: "HARD", problemUrl: "https://leetcode.com/problems/largest-rectangle-in-histogram/", platform: { id: 1, name: "LeetCode" }, topics: [{ topic: { id: 6, name: "Stacks" } }] }
];

const solvedByUser = new Map();

function getSolvedSet(userId) {
    if (!solvedByUser.has(userId)) {
        solvedByUser.set(userId, new Set());
    }
    return solvedByUser.get(userId);
}

module.exports = { localProblems, getSolvedSet };
