# KoalaVault QA Strategy

**Project:** Multi-tenant Telegram bot with IMAP email search
**Stack:** TypeScript · Telegraf · Fastify · PostgreSQL · imapflow
**Date:** 2026-02-21
**Author:** QA Engineering

---

## Table of Contents

1. [Testing Pyramid Strategy](#1-testing-pyramid-strategy)
2. [Critical Test Cases](#2-critical-test-cases)
3. [Recommended Test Setup](#3-recommended-test-setup)
4. [CI/CD Quality Gates](#4-cicd-quality-gates)
5. [Edge Cases Specific to This Project](#5-edge-cases-specific-to-this-project)

---

## 1. Testing Pyramid Strategy

```
         /\
        /E2E\          ~5% — Full bot flows (happy paths + critical failures)
       /------\
      /  Integ  \      ~25% — DB queries, IMAP mocks, Fastify routes
     /------------\
    /  Unit Tests   \  ~70% — Pure logic: validators, formatters, resolvers
   /________________\
```

The majority of confidence comes from fast, deterministic unit tests. Integration tests
own every database query and external-service boundary. E2E tests are narrow — one
scenario per user-facing feature.

---

### 1.1 Unit Tests

Unit tests cover every class with pure or near-pure logic. Each class has exactly one
method (1 class = 1 method pattern), so each test file mirrors one source file.

| Domain | Classes / Methods to Test |
|---|---|
| **Validators** | `ValidateEmail`, `ValidateEmailList`, `ValidateRegex`, `ValidateCategoryName` |
| **Encryption** | `EncryptCredential`, `DecryptCredential`, `HashTenantKey` |
| **IMAP config resolution** | `ResolveImapConfig` (exact email match → domain match → provider default → not found) |
| **Message formatters** | `FormatEmailResult`, `FormatCategoryList`, `FormatErrorMessage`, `FormatWhitelistStatus` |
| **Regex extraction** | `ExtractContentWithRegex` (match, no match, multiple capture groups, empty input) |
| **Whitelist logic** | `CheckWhitelistStatus` (allowed, denied, pending, unknown tenant) |
| **Category selection** | `ResolveCategoryFromInput` (single, multiple, invalid index, out-of-range) |
| **Tenant resolution** | `ResolveTenantFromBotToken` (found, not found, deleted) |

**What unit tests do NOT cover:**
- Anything that calls the database or opens a socket.
- Telegram bot lifecycle (middleware chains, session state).

---

### 1.2 Integration Tests

Integration tests run against a real PostgreSQL instance (separate schema per run)
and a mocked imapflow client. Fastify routes are tested via `fastify.inject()` — no
live HTTP port needed.

| Area | What to Cover |
|---|---|
| **Repository layer** | Every SQL query method: insert, select, update, delete for tenants, users, categories, IMAP configs, whitelist entries |
| **IMAP connection** | `SearchEmailsByCategory` with a stubbed `ImapFlow` client — verifies mailbox open, search query construction, message fetch, connection close |
| **Multi-email pipeline** | `ProcessMultipleEmails` — verifies concurrent Promise.allSettled behaviour, partial failure isolation |
| **Whitelist repository** | `AddWhitelistEntry`, `ApproveWhitelistEntry`, `GetWhitelistStatus` against a live test schema |
| **Admin repository** | `AddAdmin`, `RevokeAdmin`, `GetAdminsByTenant` |
| **Fastify webhook route** | POST `/webhook/:tenantId` — verifies 200 on valid payload, 400 on missing body, 403 on unknown tenant |

---

### 1.3 End-to-End Tests

E2E tests simulate a real Telegram `Update` object being dispatched through the full
Telegraf middleware stack against a seeded test database. They do not call real IMAP
servers; imapflow is replaced by a controllable test double at the module level.

| Flow | Scenario |
|---|---|
| **Onboarding** | New user sends `/start` → receives whitelist-pending message |
| **Whitelisted user search** | User selects category → sends email address → bot returns formatted results |
| **Admin approves user** | Admin sends `/approve @user` → user status changes to allowed |
| **Admin adds category** | Admin sends `/addcategory Work` → category appears in selection menu |
| **Admin sets IMAP** | Admin sends `/setimap` with credentials → config stored encrypted |
| **Search not found** | IMAP stub returns empty → bot sends "no results" message |
| **IMAP error** | IMAP stub throws `AuthenticationFailed` → bot sends user-friendly error, logs internally |

---

## 2. Critical Test Cases

### 2.1 Email Validation

```typescript
// Class: ValidateEmail
describe('ValidateEmail', () => {
  it('accepts a standard RFC 5321 address', () => expect(validate('user@example.com')).toBe(true));
  it('accepts subaddressing (plus addressing)', () => expect(validate('user+tag@example.com')).toBe(true));
  it('accepts subdomain address', () => expect(validate('user@mail.example.co.uk')).toBe(true));
  it('rejects missing @', () => expect(validate('userexample.com')).toBe(false));
  it('rejects missing domain', () => expect(validate('user@')).toBe(false));
  it('rejects missing local part', () => expect(validate('@example.com')).toBe(false));
  it('rejects double dots in local part', () => expect(validate('us..er@example.com')).toBe(false));
  it('rejects whitespace', () => expect(validate('us er@example.com')).toBe(false));
  it('rejects empty string', () => expect(validate('')).toBe(false));
  it('rejects SQL injection attempt', () => expect(validate("admin'--@x.com")).toBe(false));
});

// Class: ValidateEmailList (multi-email input)
describe('ValidateEmailList', () => {
  it('accepts comma-separated list of valid addresses');
  it('accepts newline-separated list');
  it('rejects list containing one invalid address among valid ones');
  it('deduplicates identical addresses');
  it('rejects list exceeding maximum count (e.g. > 10)');
});
```

---

### 2.2 Whitelist Check

```typescript
describe('CheckWhitelistStatus', () => {
  it('returns ALLOWED when user is on approved whitelist');
  it('returns DENIED when user is explicitly blocked');
  it('returns PENDING when request exists but not yet approved');
  it('returns NOT_REQUESTED when no record exists for user');
  it('returns TENANT_NOT_FOUND when tenantId does not exist');
  it('treats userId as case-sensitive (Telegram user IDs are numeric, no case issue — verify type)');
  it('does not leak whitelist data across tenants: user allowed in tenant A is PENDING in tenant B');
});
```

---

### 2.3 IMAP Config Resolution

This is the most logic-heavy resolver. Test the full priority chain.

```typescript
describe('ResolveImapConfig', () => {
  // Priority 1: exact email match
  it('returns config for exact email address match over domain match');

  // Priority 2: domain match
  it('returns domain-level config when no exact match exists');
  it('extracts domain correctly from user+tag@sub.domain.com');

  // Priority 3: provider default
  it('returns provider default (e.g. Gmail IMAP) when domain has no custom config');
  it('matches gmail.com, googlemail.com to the same provider default');
  it('matches outlook.com, hotmail.com, live.com to the same provider default');

  // Priority 4: not found
  it('returns null when no exact, domain, or provider match exists');
  it('does not return configs belonging to a different tenant');

  // Guard cases
  it('throws if email is malformed rather than silently returning null');
});
```

---

### 2.4 Category Selection Flow

```typescript
describe('ResolveCategoryFromInput', () => {
  // Single category tenant
  it('auto-selects the only category without prompting user');

  // Multiple categories
  it('presents numbered list when multiple categories exist');
  it('resolves selection by valid 1-based index');
  it('rejects index 0 (out of range)');
  it('rejects index greater than category count');
  it('rejects non-numeric input when numeric selection expected');
  it('rejects selection after session timeout (category list no longer valid)');

  // Empty
  it('returns NO_CATEGORIES_CONFIGURED error when tenant has no categories');
});
```

---

### 2.5 Email Search

```typescript
describe('SearchEmailsByCategory', () => {
  // Happy paths
  it('returns formatted results when IMAP search finds messages');
  it('returns NOT_FOUND response when search returns empty array');
  it('applies category regex filter after fetching messages');
  it('limits results to configured max (e.g. top 5 most recent)');

  // Connection failures
  it('returns user-facing error on AuthenticationFailed from imapflow');
  it('returns user-facing error on ECONNREFUSED');
  it('returns user-facing error on connection timeout (simulate with jest.useFakeTimers)');
  it('always calls client.logout() in finally block even when search throws');

  // Data shape
  it('extracts subject, sender, date from fetched message envelope');
  it('handles missing envelope fields gracefully (subject undefined → "(no subject)")');
  it('handles non-UTF-8 encoded subjects without throwing');
});
```

---

### 2.6 Regex Content Extraction

```typescript
describe('ExtractContentWithRegex', () => {
  it('returns first capture group when pattern matches');
  it('returns all named capture groups as key-value map');
  it('returns null when pattern does not match');
  it('handles multiline email body with DOTALL flag');
  it('returns null (not throws) on empty input string');
  it('returns null (not throws) on null/undefined input');

  // Safety
  it('enforces execution timeout to prevent ReDoS — see edge cases section');
  it('rejects pattern longer than configured max length');
  it('rejects pattern with catastrophic backtracking signature (e.g. (a+)+)');
});
```

---

### 2.7 Admin Commands

```typescript
describe('Admin: AddCategory', () => {
  it('creates category and returns confirmation');
  it('rejects duplicate category name (case-insensitive) within tenant');
  it('rejects category name exceeding max length');
  it('rejects if caller is not admin of that tenant');
});

describe('Admin: SetImapConfig', () => {
  it('stores encrypted credentials and returns confirmation');
  it('validates host/port/username/password before storing');
  it('rejects if caller is not admin of that tenant');
  it('overwrites existing config for same email/domain without creating duplicate');
});

describe('Admin: ApproveUser', () => {
  it('changes whitelist status from PENDING to ALLOWED');
  it('returns error if target user has no pending request');
  it('rejects if caller is not admin of that tenant');
  it('does not allow approving a user in a different tenant');
});
```

---

### 2.8 Multi-Tenant Isolation

These are security-critical tests. Run against a seeded database with at least two
fully-configured tenants.

```typescript
describe('Multi-tenant isolation', () => {
  it('user A (tenant 1) cannot retrieve categories belonging to tenant 2');
  it('user A (tenant 1) cannot trigger a search that uses tenant 2 IMAP credentials');
  it('admin of tenant 1 cannot approve a user in tenant 2');
  it('admin of tenant 1 cannot read the whitelist of tenant 2');
  it('IMAP credentials for tenant 1 are never included in tenant 2 query results');
  it('bot token for tenant 1 cannot be used to invoke tenant 2 webhook');
  it('deleting tenant 1 does not cascade-delete tenant 2 data');
});
```

---

### 2.9 Concurrent Email Processing

```typescript
describe('ProcessMultipleEmails', () => {
  it('processes 3 emails concurrently via Promise.allSettled');
  it('returns results in input order regardless of completion order');
  it('isolates failure: one IMAP error does not fail the other two results');
  it('all 3 IMAP connections are closed (logout called) even when one errors');
  it('does not exceed configured concurrency limit (e.g. 5 simultaneous connections)');
  it('deduplicates identical email addresses before processing');
  it('handles the case where all 3 fail with distinct errors');
});
```

---

## 3. Recommended Test Setup

### 3.1 Test Framework: Vitest

**Recommendation: Vitest** over Jest for this project.

| Criterion | Vitest | Jest |
|---|---|---|
| Native TypeScript | Yes (no ts-jest transformer needed) | Requires ts-jest or babel-jest |
| ESM support | First-class | Requires configuration flags |
| Speed | Faster (Vite-based, parallel by default) | Slower cold start |
| API compatibility | Jest-compatible (`describe`, `it`, `expect`, `vi.*`) | Native |
| Inline coverage | Via `@vitest/coverage-v8` | Via `jest --coverage` |
| Watch mode | Excellent HMR-aware watch | Polling-based |

**Configuration (`vitest.config.ts`):**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/e2e/**'],  // E2E runs separately
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/types/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    pool: 'forks',       // Isolate DB tests via separate processes
    poolOptions: {
      forks: { singleFork: false },
    },
    setupFiles: ['tests/setup/global.ts'],
  },
});
```

**Separate E2E config (`vitest.e2e.config.ts`):**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    setupFiles: ['tests/setup/e2e.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },  // E2E: single process, seeded DB
  },
});
```

---

### 3.2 IMAP Mock Strategy

**Do not use a live IMAP server in CI.** Use a two-layer mock approach:

**Layer 1 — Unit tests: full vi.mock()**

```typescript
// tests/mocks/imapflow.ts
import { vi } from 'vitest';

export const mockSearch = vi.fn();
export const mockFetch = vi.fn();
export const mockConnect = vi.fn();
export const mockLogout = vi.fn();

vi.mock('imapflow', () => ({
  ImapFlow: vi.fn().mockImplementation(() => ({
    connect: mockConnect,
    logout: mockLogout,
    getMailboxLock: vi.fn().mockResolvedValue({
      release: vi.fn(),
    }),
    search: mockSearch,
    fetch: mockFetch,
    [Symbol.asyncIterator]: vi.fn(),
  })),
}));
```

Usage in test:

```typescript
import { mockSearch, mockFetch, mockLogout } from '../mocks/imapflow';

beforeEach(() => {
  mockSearch.mockResolvedValue(['1', '2', '3']);
  mockFetch.mockImplementation(async function* () {
    yield { uid: '1', envelope: { subject: 'Test', from: [{ address: 'a@b.com' }], date: new Date() } };
  });
});

afterEach(() => {
  vi.resetAllMocks();
});
```

**Layer 2 — Integration tests: GreenMail or Dovecot in Docker**

For a small number of true integration tests that verify the imapflow query construction
is correct, spin up a Dovecot container in `docker-compose.test.yml`:

```yaml
services:
  imap-test:
    image: dovecot/dovecot:latest
    environment:
      MAIL_LOCATION: maildir:/tmp/mail
    ports:
      - "10143:143"
    volumes:
      - ./tests/fixtures/imap:/etc/dovecot/conf.d
```

These tests are tagged `@imap-integration` and run only in the `integration` CI job,
not on every PR push.

---

### 3.3 Telegram Bot Mock Strategy

Telegraf tests should never call the real Bot API. Use two approaches:

**Approach A — Context mock for unit/integration tests:**

```typescript
// tests/mocks/telegraf-context.ts
import { vi } from 'vitest';
import type { Context } from 'telegraf';

export function createMockContext(overrides: Partial<Context> = {}): Context {
  return {
    reply: vi.fn().mockResolvedValue({}),
    replyWithMarkdown: vi.fn().mockResolvedValue({}),
    answerCbQuery: vi.fn().mockResolvedValue(true),
    editMessageText: vi.fn().mockResolvedValue({}),
    from: { id: 123456, username: 'testuser', first_name: 'Test', is_bot: false },
    chat: { id: 123456, type: 'private' },
    message: {
      text: '/start',
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 123456, type: 'private' },
      from: { id: 123456, username: 'testuser', first_name: 'Test', is_bot: false },
    },
    session: {},
    state: {},
    ...overrides,
  } as unknown as Context;
}
```

**Approach B — Full bot dispatch for E2E tests:**

```typescript
// tests/e2e/helpers/dispatch.ts
import { bot } from '../../src/bot';
import type { Update } from 'telegraf/types';

export async function dispatchUpdate(update: Update): Promise<void> {
  // Telegraf exposes handleUpdate for testing without a webhook
  await bot.handleUpdate(update);
}

export function buildTextUpdate(userId: number, text: string, botId: number): Update.MessageUpdate {
  return {
    update_id: Math.floor(Math.random() * 1_000_000),
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: { id: userId, type: 'private' },
      from: { id: userId, is_bot: false, first_name: 'Test' },
      text,
      entities: text.startsWith('/') ? [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }] : [],
    },
  };
}
```

This lets E2E tests assert on `ctx.reply` calls via the mock context spy without
needing network access.

---

### 3.4 Test Database Setup

**Rule: each test run gets its own PostgreSQL schema. Tests never share state.**

**Strategy: schema-per-worker using `TEST_SCHEMA` env variable**

```typescript
// tests/setup/db.ts
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

const schemaName = `test_${randomUUID().replace(/-/g, '_')}`;

export const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/koalavault_test',
  // Override search_path so all queries hit the isolated schema
});

export async function createTestSchema(): Promise<void> {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  await pool.query(`SET search_path TO "${schemaName}"`);
  // Run migrations against this schema
  await runMigrations(pool, schemaName);
}

export async function dropTestSchema(): Promise<void> {
  await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
}

export async function seedTestData(): Promise<{ tenant1: Tenant; tenant2: Tenant }> {
  // Insert minimal fixture data: 2 tenants, 2 users, categories, IMAP configs
  // Return entity IDs for use in tests
}
```

**global.ts setup file:**

```typescript
// tests/setup/global.ts
import { createTestSchema, dropTestSchema } from './db';

beforeAll(async () => {
  await createTestSchema();
});

afterAll(async () => {
  await dropTestSchema();
});
```

**docker-compose.test.yml:**

```yaml
services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: koalavault_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"   # Non-standard port avoids collision with dev DB
    tmpfs:
      - /var/lib/postgresql/data   # In-memory for speed; data doesn't persist
```

---

## 4. CI/CD Quality Gates

### 4.1 Pipeline Structure

```yaml
# .github/workflows/ci.yml

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:

  # Gate 1: runs on every commit, must pass before other jobs
  static-analysis:
    name: Type Check + Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit                  # Strict type check, no output
      - run: npx eslint src tests --max-warnings 0

  # Gate 2: fast, no external services
  unit:
    name: Unit Tests
    needs: static-analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/lcov.info

  # Gate 3: requires PostgreSQL service container
  integration:
    name: Integration Tests
    needs: unit
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: koalavault_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
        ports:
          - 5433:5432
    env:
      TEST_DATABASE_URL: postgresql://test:test@localhost:5433/koalavault_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --config vitest.integration.config.ts

  # Gate 4: E2E — only on push to main/develop, not on every PR
  e2e:
    name: E2E Tests
    needs: integration
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: koalavault_test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: ['5433:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx vitest run --config vitest.e2e.config.ts

  # Gate 5: security audit
  security:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

---

### 4.2 Coverage Thresholds

| Metric | Threshold | Enforcement |
|---|---|---|
| Lines | 80% | Vitest `thresholds.lines` — build fails below |
| Functions | 80% | Vitest `thresholds.functions` |
| Branches | 75% | Vitest `thresholds.branches` (lower: branches are hard to exhaust) |
| Statements | 80% | Vitest `thresholds.statements` |

**Per-file minimums** for security-critical modules:

```typescript
// vitest.config.ts — per-file overrides
thresholds: {
  // Global
  lines: 80,
  // File-level: zero-tolerance for untested security paths
  perFile: true,
  // Files matching these patterns must hit 95%
  // Achieved by adding a separate check step in CI:
  // npx vitest run --coverage --reporter=verbose
},
```

Add a separate CI step to enforce higher coverage on critical files:

```bash
# In CI after vitest coverage run:
node scripts/check-critical-coverage.js \
  --file "src/encryption/**" --min 95 \
  --file "src/whitelist/**" --min 90 \
  --file "src/imap-config-resolver/**" --min 90 \
  --lcov coverage/lcov.info
```

---

### 4.3 Type Checking

- `tsc --noEmit --strict` — runs in `static-analysis` job, blocks all other jobs if it fails.
- `strict: true` in `tsconfig.json` — enables `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`.
- No `@ts-ignore` comments permitted in `src/` — enforced via ESLint rule `@typescript-eslint/ban-ts-comment`.
- `@typescript-eslint/no-explicit-any` set to `error` — forces proper typing of IMAP message shapes and Telegraf context.

---

### 4.4 PR Checks Summary

| Check | On PR | On Push to Main |
|---|---|---|
| TypeScript strict compile | Yes | Yes |
| ESLint (zero warnings) | Yes | Yes |
| Unit tests + coverage thresholds | Yes | Yes |
| Integration tests | Yes | Yes |
| E2E tests | No | Yes |
| `npm audit --audit-level=high` | Yes | Yes |
| Docker build smoke test | No | Yes |

---

## 5. Edge Cases Specific to This Project

### 5.1 Bot Token Collision

**Scenario:** Two tenants are accidentally configured with the same Telegram bot token.
When Telegram delivers an update, the webhook router cannot determine which tenant to
dispatch to.

**Test:**

```typescript
it('rejects tenant registration when bot token is already assigned to another tenant', async () => {
  await createTenant({ botToken: 'token-abc' });
  await expect(createTenant({ botToken: 'token-abc' })).rejects.toThrow(
    'BotTokenAlreadyInUse'
  );
});

it('webhook router returns 409 when two tenants share the same token (defensive check)', async () => {
  // Simulate DB inconsistency (bypass validation layer)
  await db.query(`INSERT INTO tenants (bot_token) VALUES ($1), ($1)`, ['token-abc']);
  const response = await app.inject({ method: 'POST', url: '/webhook/token-abc' });
  expect(response.statusCode).toBe(409);
  // Verify an alert/log was emitted — this is a data integrity violation
});
```

**Mitigation:** `UNIQUE` constraint on `tenants.bot_token` column.

---

### 5.2 Tenant Deleted Mid-Session

**Scenario:** User starts a search interaction (category selected, waiting for email input).
Before they send the email, the tenant is deleted by a super-admin.

**Test:**

```typescript
it('returns graceful error when tenant is deleted after category selection but before email input', async () => {
  const ctx = createMockContext({ from: { id: userId }, session: { awaitingEmail: true, tenantId: 'tenant-1' } });

  // Simulate tenant deletion between interaction steps
  await db.query(`DELETE FROM tenants WHERE id = 'tenant-1'`);

  await handleEmailInput(ctx, 'user@example.com');

  expect(ctx.reply).toHaveBeenCalledWith(
    expect.stringContaining('service is no longer available')
  );
  // Session must be cleared to prevent the user being stuck
  expect(ctx.session.awaitingEmail).toBeFalsy();
});
```

---

### 5.3 IMAP Connection Timeout During Search

**Scenario:** The IMAP server accepts the connection but never responds to the SEARCH
command (firewall black-hole, not a refused connection).

**Test:**

```typescript
it('aborts IMAP search and returns timeout error after configured deadline', async () => {
  vi.useFakeTimers();

  mockConnect.mockResolvedValue(undefined);
  mockSearch.mockImplementation(
    () => new Promise<never>(() => {})  // Never resolves
  );

  const searchPromise = searchEmailsByCategory({ email: 'a@b.com', categoryId: 'cat-1', tenantId: 'tenant-1' });

  // Advance past the timeout threshold (e.g. 10 seconds)
  vi.advanceTimersByTime(10_001);

  await expect(searchPromise).resolves.toEqual({
    success: false,
    error: 'IMAP_TIMEOUT',
    userMessage: expect.stringContaining('timed out'),
  });

  // Verify cleanup: logout must still be called
  expect(mockLogout).toHaveBeenCalledOnce();

  vi.useRealTimers();
});
```

**Implementation note:** wrap every `ImapFlow` operation in `Promise.race` against an
`AbortController`-based timeout. Store `IMAP_TIMEOUT_MS` in configuration, default 10000.

---

### 5.4 Regex That Could Cause ReDoS

**Scenario:** A malicious or naive admin stores a regex pattern that exhibits catastrophic
backtracking when matched against a long email body.

**Pattern example:** `(a+)+b` matched against `"aaaaaaaaaaaaaaaaaaaaaaaaaac"`

**Tests:**

```typescript
it('validates regex against known ReDoS signatures at storage time', async () => {
  await expect(
    saveCategory({ regex: '(a+)+', tenantId: 'tenant-1' })
  ).rejects.toThrow('RegexDangerousPattern');
});

it('enforces wall-clock timeout when executing regex against email body', async () => {
  // Bypass storage-time validation (simulate a pattern that slipped through)
  const result = await extractWithTimeout({
    pattern: '(a+)+b',
    input: 'a'.repeat(30) + 'c',
    timeoutMs: 100,
  });
  expect(result).toBeNull();  // Timeout returns null, does not hang process
});

it('rejects patterns exceeding maximum allowed length (500 chars)', async () => {
  await expect(
    saveCategory({ regex: 'a'.repeat(501), tenantId: 'tenant-1' })
  ).rejects.toThrow('RegexTooLong');
});
```

**Implementation note:** use the `safe-regex2` or `vuln-regex-detector` npm package at
save time. At execution time, run regex in a `worker_threads` context with a forced
termination timeout to prevent blocking the event loop.

---

### 5.5 User Sends Email Then Immediately Sends Another (Race Condition)

**Scenario:** User sends `search@email.com`, and before the first search completes, sends
`another@email.com`. Two concurrent IMAP sessions open for the same user/tenant. Results
arrive out of order.

**Tests:**

```typescript
it('processes only the most recent email search if user sends two in rapid succession', async () => {
  // Simulate a user in mid-session sending two messages
  const ctx = createMockContext({ session: { awaitingEmail: true, searchSequence: 0 } });

  // First search takes 500ms, second takes 100ms
  let call = 0;
  mockSearch.mockImplementation(async () => {
    const delay = call++ === 0 ? 500 : 100;
    await new Promise(r => setTimeout(r, delay));
    return ['msg-1'];
  });

  const [result1, result2] = await Promise.all([
    handleEmailInput({ ...ctx, sequenceId: 1 }, 'first@example.com'),
    handleEmailInput({ ...ctx, sequenceId: 2 }, 'second@example.com'),
  ]);

  // The reply to the user should only show the result for the latest search
  const replyCalls = (ctx.reply as ReturnType<typeof vi.fn>).mock.calls;
  expect(replyCalls).toHaveLength(1);
  expect(replyCalls[0][0]).toContain('second@example.com');
});

it('does not open more than MAX_CONCURRENT_IMAP_SESSIONS connections per user', async () => {
  // MAX_CONCURRENT_IMAP_SESSIONS = 1 per user by default
  const openConnections: number[] = [];
  let current = 0;

  mockConnect.mockImplementation(async () => {
    current++;
    openConnections.push(current);
    await new Promise(r => setTimeout(r, 200));
    current--;
  });

  await Promise.all([
    handleEmailInput(ctx, 'a@example.com'),
    handleEmailInput(ctx, 'b@example.com'),
    handleEmailInput(ctx, 'c@example.com'),
  ]);

  expect(Math.max(...openConnections)).toBeLessThanOrEqual(1);
});
```

**Implementation note:** use a per-user async mutex (e.g. `async-mutex` package) or
an in-memory queue keyed by `userId` to serialize IMAP sessions per user. Track a
`searchSequence` counter in the session: discard results for any sequence number older
than the current one.

---

## Appendix: File/Directory Structure for Tests

```
project-root/
├── src/
│   └── ... (source code)
├── tests/
│   ├── setup/
│   │   ├── global.ts          # beforeAll/afterAll for schema lifecycle
│   │   ├── db.ts              # Pool, createTestSchema, dropTestSchema, seedTestData
│   │   └── e2e.ts             # E2E-specific setup (bot init, webhook binding)
│   ├── mocks/
│   │   ├── imapflow.ts        # vi.mock('imapflow') factory
│   │   └── telegraf-context.ts # createMockContext helper
│   ├── fixtures/
│   │   ├── emails.ts          # Sample IMAP message objects
│   │   ├── tenants.ts         # Seed data builders
│   │   └── imap/              # Dovecot config for integration IMAP container
│   ├── unit/
│   │   ├── validators/
│   │   ├── encryption/
│   │   ├── imap-config-resolver/
│   │   ├── message-formatters/
│   │   └── regex-extractor/
│   ├── integration/
│   │   ├── repositories/
│   │   ├── imap-search/
│   │   └── fastify-routes/
│   └── e2e/
│       ├── helpers/
│       │   └── dispatch.ts
│       ├── onboarding.test.ts
│       ├── search-flow.test.ts
│       └── admin-commands.test.ts
├── vitest.config.ts
├── vitest.integration.config.ts
├── vitest.e2e.config.ts
└── docker-compose.test.yml
```

---

## Appendix: Key npm Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:all": "npm run test:coverage && npm run test:integration && npm run test:e2e",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests --max-warnings 0"
  }
}
```
