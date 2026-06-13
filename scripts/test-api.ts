/**
 * Smoke-tests for auth guards and request validation against a running server.
 *
 * Usage:
 *   npx tsx scripts/test-api.ts
 *
 * Env vars:
 *   BASE_URL    API base URL (default http://localhost:3001)
 *   AUTH_COOKIE A valid "token=..." cookie for an authenticated user.
 *               Without it, only the auth-guard checks run.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const AUTH_COOKIE = process.env.AUTH_COOKIE;

let passed = 0;
let failed = 0;

interface ApiBody {
    success?: boolean;
    data?: unknown;
    errors?: unknown[];
}

async function call(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE_URL}/api${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    let body: ApiBody = {};
    try {
        body = await res.json();
    } catch {
        // non-JSON response
    }

    return { status: res.status, body };
}

function check(name: string, condition: boolean, details?: unknown) {
    if (condition) {
        passed++;
        console.log(`PASS: ${name}`);
    } else {
        failed++;
        console.log(`FAIL: ${name}`);
        if (details !== undefined) {
            console.log(`      ${JSON.stringify(details)}`);
        }
    }
}

function isValidationError(body: ApiBody) {
    return body.success === false && body.data === "Validation error" && Array.isArray(body.errors);
}

async function testAuthGuards() {
    console.log("\n--- Auth guards (no cookie) ---");

    let res = await call("/cards");
    check("GET /cards without auth -> 401", res.status === 401, res);

    res = await call("/cards", { method: "POST", body: JSON.stringify({ title: "x" }) });
    check("POST /cards without auth -> 401", res.status === 401, res);

    res = await call("/cards/1");
    check("GET /cards/:id without auth -> 401", res.status === 401, res);

    res = await call("/cards/1", { method: "PATCH", body: JSON.stringify({ title: "x" }) });
    check("PATCH /cards/:id without auth -> 401", res.status === 401, res);

    res = await call("/cards/1/comments", { method: "POST", body: JSON.stringify({ body: "x" }) });
    check("POST /cards/:id/comments without auth -> 401", res.status === 401, res);

    res = await call("/users");
    check("GET /users without auth -> 401", res.status === 401, res);

    res = await call("/auth/me");
    check("GET /auth/me without auth -> 401", res.status === 401, res);
}

async function testValidation() {
    console.log("\n--- Request validation (authenticated) ---");
    const headers = { Cookie: AUTH_COOKIE! };

    // POST /cards
    let res = await call("/cards", { method: "POST", headers, body: JSON.stringify({}) });
    check("POST /cards without title -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards", { method: "POST", headers, body: JSON.stringify({ title: "" }) });
    check("POST /cards with empty title -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: "Valid title", priority: "not-a-priority" }),
    });
    check("POST /cards with invalid priority -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards", {
        method: "POST",
        headers,
        body: JSON.stringify({ title: "Valid title", assigneeId: "not-an-id" }),
    });
    check("POST /cards with non-numeric assigneeId -> validation error", isValidationError(res.body), res.body);

    // GET /cards/:id and PATCH /cards/:id with bad id
    res = await call("/cards/not-a-number", { headers });
    check("GET /cards/:id with non-numeric id -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards/not-a-number", { method: "PATCH", headers, body: JSON.stringify({ title: "x" }) });
    check("PATCH /cards/:id with non-numeric id -> validation error", isValidationError(res.body), res.body);

    // PATCH /cards/:id with bad status/priority/position
    res = await call("/cards/1", { method: "PATCH", headers, body: JSON.stringify({ status: "not-a-column" }) });
    check("PATCH /cards/:id with invalid status -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards/1", { method: "PATCH", headers, body: JSON.stringify({ priority: "not-a-priority" }) });
    check("PATCH /cards/:id with invalid priority -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards/1", { method: "PATCH", headers, body: JSON.stringify({ position: "not-a-number" }) });
    check("PATCH /cards/:id with non-numeric position -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards/1", { method: "PATCH", headers, body: JSON.stringify({ title: "" }) });
    check("PATCH /cards/:id with empty title -> validation error", isValidationError(res.body), res.body);

    // POST /cards/:id/comments
    res = await call("/cards/1/comments", { method: "POST", headers, body: JSON.stringify({}) });
    check("POST /cards/:id/comments without body -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards/1/comments", { method: "POST", headers, body: JSON.stringify({ body: "   " }) });
    check("POST /cards/:id/comments with blank body -> validation error", isValidationError(res.body), res.body);

    res = await call("/cards/not-a-number/comments", {
        method: "POST",
        headers,
        body: JSON.stringify({ body: "ok" }),
    });
    check("POST /cards/:id/comments with non-numeric id -> validation error", isValidationError(res.body), res.body);
}

async function main() {
    await testAuthGuards();

    if (AUTH_COOKIE) {
        await testValidation();
    } else {
        console.log("\n(skipping authenticated validation tests — set AUTH_COOKIE to run them)");
    }

    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

main();
