
const assert = require("node:assert/strict");
const { once } = require("node:events");
const http = require("node:http");
const test = require("node:test");
const { randomUUID } = require("node:crypto");

const app = require("../src/app");
const prisma = require("../src/config/prisma");

const request = async (server, path, options = {}) => {
    const address = server.address();

    const response = await fetch(
        `http://127.0.0.1:${address.port}${path}`,
        {
            method: options.method || "GET",
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        }
    );

    return {
        body: await response.json(),
        status: response.status
    };
};

const startServer = async () => {
    const server = http.createServer(app).listen(0);
    await once(server, "listening");
    return server;
};

// Health check
test("GET /api/health/ reports a healthy API", async (t) => {
    const server = await startServer();
    t.after(() => server.close());

    const response = await request(server, "/api/health/");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        success: true,
        message: "CodeNova backend is running!",
        data: {
            status: "healthy",
            service: "CodeNova API"
        }
    });
});

// Unknown route
test("unknown routes return a JSON 404 response", async (t) => {
    const server = await startServer();
    t.after(() => server.close());

    const response = await request(server, "/api/does-not-exist");

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
        success: false,
        message: "Route not found"
    });
});
// Problem Bank API
test("Problem Bank API returns problems with pagination", async (t) => {
    const server = await startServer();
    t.after(() => server.close());

    // 1. Get all problems
    const allProblems = await request(server, "/api/problems");

    assert.equal(allProblems.status, 200);
    assert.equal(allProblems.body.success, true);
    assert.ok(allProblems.body.count > 0);
    assert.ok(allProblems.body.data.problems.length > 0);

    // 2. Test pagination
    const pageTwo = await request(
        server,
        "/api/problems?page=2&limit=10"
    );

    assert.equal(pageTwo.status, 200);
    assert.equal(pageTwo.body.pagination.page, 2);
    assert.equal(pageTwo.body.pagination.limit, 10);

    // 3. Test difficulty filter
    const easyProblems = await request(
        server,
        "/api/problems?difficulty=EASY"
    );

    assert.equal(easyProblems.status, 200);
    assert.ok(
        easyProblems.body.data.problems.every(
            (problem) => problem.difficulty === "EASY"
        )
    );

    // 4. Test invalid difficulty
    const invalidDifficulty = await request(
        server,
        "/api/problems?difficulty=INVALID"
    );

    assert.equal(invalidDifficulty.status, 400);

    // 5. Test individual problem
    const problem = await request(server, "/api/problems/1");

    assert.equal(problem.status, 200);
    assert.equal(problem.body.data.problem.id, 1);

    // 6. Test invalid problem ID
    const invalidId = await request(server, "/api/problems/abc");

    assert.equal(invalidId.status, 400);
});

// Progress API
test("Progress API handles user progress and isolation", async (t) => {
    const server = await startServer();

    const userAEmail = `user-a-${randomUUID()}@codenova.com`;
    const userBEmail = `user-b-${randomUUID()}@codenova.com`;
    const password = "testpassword123";

    t.after(async () => {
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [userAEmail, userBEmail]
                }
            }
        });

        await new Promise((resolve) => server.close(resolve));
    });

    // Create two users
    const signupA = await request(server, "/api/auth/signup", {
        method: "POST",
        body: { name: "User A", email: userAEmail, password }
    });

    const signupB = await request(server, "/api/auth/signup", {
        method: "POST",
        body: { name: "User B", email: userBEmail, password }
    });

    assert.equal(signupA.status, 201);
    assert.equal(signupB.status, 201);

    const tokenA = signupA.body.data.token;
    const tokenB = signupB.body.data.token;

    // 1. Access without authentication
    const unauthorized = await request(server, "/api/progress");

    assert.equal(unauthorized.status, 401);

    // 2. User A marks problem 1 as solved
    const solve = await request(server, "/api/progress/1", {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${tokenA}`
        }
    });

    assert.equal(solve.status, 200);
    assert.equal(solve.body.data.progress.status, "SOLVED");

    // 3. User A retrieves progress
    const progressA = await request(server, "/api/progress", {
        headers: {
            Authorization: `Bearer ${tokenA}`
        }
    });

    assert.equal(progressA.status, 200);
    assert.equal(progressA.body.count, 1);

    // 4. User B retrieves their progress
    const progressB = await request(server, "/api/progress", {
        headers: {
            Authorization: `Bearer ${tokenB}`
        }
    });

    assert.equal(progressB.status, 200);
    assert.equal(progressB.body.count, 0);
});
// Dashboard API
test("Dashboard API returns correct user statistics", async (t) => {
    const server = await startServer();

    const email = `dashboard-${randomUUID()}@codenova.com`;
    const password = "testpassword123";

    t.after(async () => {
        await prisma.user.deleteMany({
            where: { email }
        });

        await new Promise((resolve) => server.close(resolve));
    });

    // 1. Create a test user
    const signup = await request(server, "/api/auth/signup", {
        method: "POST",
        body: {
            name: "Dashboard User",
            email,
            password
        }
    });

    assert.equal(signup.status, 201);

    const token = signup.body.data.token;

    // 2. Access dashboard without authentication
    const unauthorized = await request(server, "/api/dashboard");

    assert.equal(unauthorized.status, 401);

    // 3. Get dashboard before solving anything
    const emptyDashboard = await request(server, "/api/dashboard", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    assert.equal(emptyDashboard.status, 200);
    assert.equal(
        emptyDashboard.body.data.overview.solvedProblems,
        0
    );
    assert.equal(
        emptyDashboard.body.data.overview.totalProblems,
        14
    );
    assert.equal(
        emptyDashboard.body.data.overview.completionPercentage,
        0
    );

    // 4. Mark one problem as solved
    const solve = await request(server, "/api/progress/1", {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    assert.equal(solve.status, 200);

    // 5. Check updated dashboard
    const updatedDashboard = await request(server, "/api/dashboard", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const overview = updatedDashboard.body.data.overview;

    assert.equal(overview.totalProblems, 14);
    assert.equal(overview.solvedProblems, 1);
    assert.equal(overview.unsolvedProblems, 13);
    assert.equal(overview.completionPercentage, 7);

    // 6. Check topic progress
    const arraysTopic = updatedDashboard.body.data.topicProgress.find(
        (topic) => topic.topicName === "Arrays"
    );

    assert.ok(arraysTopic);
    assert.equal(arraysTopic.solvedProblems, 1);
    assert.equal(arraysTopic.totalProblems, 6);
});
// Complete authentication flow
test("authentication flow works correctly", async (t) => {
    const server = await startServer();

    const email = `test-${randomUUID()}@codenova.com`;
    const password = "testpassword123";

    t.after(async () => {
        await prisma.user.deleteMany({
            where: { email }
        });

        await new Promise((resolve) => server.close(resolve));
        await prisma.$disconnect();
    });

    // 1. Signup
    const signup = await request(server, "/api/auth/signup", {
        method: "POST",
        body: {
            name: "Test User",
            email,
            password
        }
    });

    assert.equal(signup.status, 201);
    assert.equal(signup.body.success, true);
    assert.equal(signup.body.data.user.email, email);
    assert.ok(signup.body.data.token);

    // 2. Duplicate signup
    const duplicateSignup = await request(server, "/api/auth/signup", {
        method: "POST",
        body: {
            name: "Test User",
            email,
            password
        }
    });

    assert.equal(duplicateSignup.status, 409);
    assert.equal(duplicateSignup.body.success, false);

    // 3. Login with correct credentials
    const login = await request(server, "/api/auth/login", {
        method: "POST",
        body: {
            email,
            password
        }
    });

    assert.equal(login.status, 200);
    assert.equal(login.body.success, true);
    assert.ok(login.body.data.token);

    const token = login.body.data.token;

    // 4. Login with incorrect password
    const incorrectLogin = await request(server, "/api/auth/login", {
        method: "POST",
        body: {
            email,
            password: "wrongpassword"
        }
    });

    assert.equal(incorrectLogin.status, 401);

    // 5. Access protected route with valid token
    const profile = await request(server, "/api/auth/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.user.email, email);

    // 6. Access protected route without token
    const unauthorized = await request(server, "/api/auth/me");

    assert.equal(unauthorized.status, 401);
});
