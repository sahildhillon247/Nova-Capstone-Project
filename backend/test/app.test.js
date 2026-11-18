
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
