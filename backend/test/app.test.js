const assert = require("node:assert/strict");
const { once } = require("node:events");
const http = require("node:http");
const test = require("node:test");

const app = require("../src/app");

const request = async (server, path) => {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`);

    return {
        body: await response.json(),
        status: response.status
    };
};

const postJson = async (server, path, body) => {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    return {
        body: await response.json(),
        status: response.status
    };
};

test("GET /api/health/ reports a healthy API", async (t) => {
    const server = http.createServer(app).listen(0);
    await once(server, "listening");
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

test("unknown routes return a JSON 404 response", async (t) => {
    const server = http.createServer(app).listen(0);
    await once(server, "listening");
    t.after(() => server.close());

    const response = await request(server, "/api/does-not-exist");

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
        success: false,
        message: "Route not found"
    });
});

test("local authentication requires signup before login", async (t) => {
    const server = http.createServer(app).listen(0);
    await once(server, "listening");
    t.after(() => server.close());

    const unknownLogin = await postJson(server, "/api/auth/login", {
        email: "missing@example.com",
        password: "password123"
    });
    assert.equal(unknownLogin.status, 401);
    assert.equal(unknownLogin.body.message, "Invalid email or password");

    const signup = await postJson(server, "/api/auth/signup", {
        name: "Test User",
        email: "registered@example.com",
        password: "password123"
    });
    assert.equal(signup.status, 201);
    assert.ok(signup.body.data.token);

    const dashboard = await fetch(`http://127.0.0.1:${server.address().port}/api/dashboard`, {
        headers: { Authorization: `Bearer ${signup.body.data.token}` }
    });
    const dashboardBody = await dashboard.json();
    assert.equal(dashboard.status, 200);
    assert.equal(dashboardBody.data.overview.totalProblems, 8);
    assert.equal(dashboardBody.data.overview.solvedProblems, 0);
});
