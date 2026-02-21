# KoalaVault Security Review

**Reviewer:** Security Engineering
**Date:** 2026-02-21
**System:** Multi-tenant Telegram Bot with IMAP Email Search
**Stack:** Telegraf · Fastify · PostgreSQL · Docker · Node.js
**Classification:** Internal — Engineering Confidential

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Critical Security Requirements](#2-critical-security-requirements)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Secure Coding Requirements](#4-secure-coding-requirements)
5. [Docker & Deployment Security](#5-docker--deployment-security)
6. [Recommendations & Implementation Guide](#6-recommendations--implementation-guide)

---

## 1. Threat Model

### 1.1 Attack Surfaces

| Surface | Protocol | Entry Point | Notes |
|---|---|---|---|
| Telegram Webhook | HTTPS POST | `/webhook/:secret` | Unauthenticated from internet; Telegram IP range only |
| Fastify HTTP API | HTTPS | All routes | Admin panel, health checks, config endpoints |
| PostgreSQL | TCP 5432 | Internal network | Must never be exposed to internet |
| IMAP connections | TCP 993/143 | Outbound from server | Credentials stored at rest; TLS required |
| Docker host | SSH/TCP | Server management | Privilege escalation path if container escapes |
| Environment variables | Process env | Container runtime | Bot token, DB credentials, encryption keys |
| `.env` / secrets files | Filesystem | CI/CD, developer machines | Credential exposure via git or logs |

### 1.2 Threat Actors

**External Attacker (Unauthenticated)**
- Goal: Access email content from any tenant, harvest credentials, pivot to mail servers
- Vectors: Webhook endpoint abuse, SQL injection through bot commands, forged Telegram updates
- Capability: High — Telegram bots are publicly discoverable

**Malicious Telegram User (Authenticated to Telegram, not whitelisted)**
- Goal: Search email on behalf of a tenant they do not belong to, exceed rate limits, enumerate users
- Vectors: Sending crafted payloads via bot commands, tenant ID manipulation in shared state
- Capability: Medium — can interact with the bot freely if not gated

**Malicious Tenant Admin**
- Goal: Access another tenant's data or IMAP credentials, escalate to master admin
- Vectors: API parameter tampering (tenant_id injection), credential export endpoints
- Capability: Medium — has legitimate access to their own tenant's configuration

**Insider / Compromised Developer**
- Goal: Extract all tenants' IMAP credentials, read all email content
- Vectors: Database read, environment variable access, log scraping
- Capability: High — direct DB access in development/staging

**Telegram Platform (Dependency)**
- Risk: Telegram could deliver malformed updates, replay old updates, or be impersonated by a MITM
- Mitigation: Webhook secret token validation, HTTPS only, Telegram IP allowlisting

### 1.3 Data Classification

| Data Item | Classification | Risk if Exposed | Storage Location |
|---|---|---|---|
| IMAP passwords | **Critical** | Full mailbox access | PostgreSQL (must be encrypted) |
| IMAP usernames/hosts | **High** | Account enumeration, targeting | PostgreSQL |
| Bot token | **Critical** | Full bot impersonation | Env var only |
| Telegram user IDs | **Medium** | User enumeration, targeted attacks | PostgreSQL |
| Email content returned by IMAP search | **High** | PII, confidential communications | In-memory only; never persisted |
| Webhook secret token | **Critical** | Forged updates delivered to bot | Env var only |
| Master admin credentials | **Critical** | Full system compromise | Env var / secrets manager |
| PostgreSQL credentials | **Critical** | Full data exfiltration | Env var only |
| Tenant configuration (whitelist, regex patterns) | **Medium** | Operational data leakage | PostgreSQL |
| Search queries (email addresses sent by users) | **Medium** | PII — email addresses | Logs (must be scrubbed) |

---

## 2. Critical Security Requirements

### 2.1 IMAP Credential Encryption

**Requirement:** IMAP passwords MUST NOT be stored in plaintext. Encryption at the application layer is required in addition to any database-level encryption, because the application itself must be able to decrypt them to make IMAP connections.

**Algorithm: AES-256-GCM**

AES-256-GCM is chosen because:
- It provides both confidentiality and integrity (authenticated encryption). Any tampering with the ciphertext produces an authentication failure rather than silently decrypting garbage.
- It is available natively in Node.js `crypto` without additional dependencies.
- The 256-bit key provides a security margin well beyond current cryptanalytic capability.

**Key Management Approach**

```
┌─────────────────────────────────────────────────────────────┐
│  IMAP_ENCRYPTION_KEY (env var, 32-byte hex, 64 hex chars)   │
│  Derived from a cryptographically random source at deploy   │
│  Stored: Docker secret / secrets manager / .env (prod only) │
└──────────────────────┬──────────────────────────────────────┘
                       │  Used by encryption module only
                       ▼
          ┌────────────────────────┐
          │  encrypt(plaintext)    │
          │  1. Generate random IV │  (12 bytes, per-encryption)
          │  2. AES-256-GCM        │
          │  3. Prepend IV + tag   │
          │  4. Base64-encode      │
          └────────────┬───────────┘
                       │  Stored in PostgreSQL
                       ▼
          imap_credentials.password_encrypted  TEXT
```

**Required Implementation — `/src/lib/crypto.ts`**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV — required for GCM
const TAG_LENGTH = 16;  // 128-bit authentication tag

function getKey(): Buffer {
  const hex = process.env.IMAP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('IMAP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

export function encryptPassword(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Layout: [IV (12)] [tag (16)] [ciphertext (variable)]
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptPassword(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, 'base64');

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}
```

**Key Generation Command (run once, store securely)**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Key Rotation Protocol**
1. Generate a new key.
2. Read all encrypted passwords using the old key.
3. Re-encrypt them with the new key in a single transaction.
4. Deploy with the new `IMAP_ENCRYPTION_KEY`.
5. Invalidate the old key from secrets storage.

Never store the old and new key simultaneously in the same environment. Use a `IMAP_ENCRYPTION_KEY_OLD` env var only during the rotation window.

---

### 2.2 SQL Injection Prevention

**Requirement:** All database queries MUST use parameterized queries. No string concatenation or template literal construction of SQL is permitted anywhere in the codebase.

**Rule: Every value that comes from user input, environment, or external system is a parameter — never interpolated.**

**Correct Pattern (using `pg` / `postgres` driver)**

```typescript
// CORRECT — parameterized
const result = await db.query(
  'SELECT id, email, subject FROM emails WHERE tenant_id = $1 AND from_address = $2',
  [tenantId, userInput]
);

// CORRECT — named params with postgres.js
const rows = await sql`
  SELECT * FROM imap_configs
  WHERE tenant_id = ${tenantId}
  AND host = ${host}
`;
```

**Prohibited Patterns — CI lint rule must flag these**

```typescript
// PROHIBITED — string concatenation
const q = `SELECT * FROM emails WHERE tenant_id = '${tenantId}'`;

// PROHIBITED — template literal in query string position
await db.query(`SELECT * FROM users WHERE id = ${userId}`);

// PROHIBITED — dynamic column/table names from user input
await db.query(`SELECT ${column} FROM ${table}`); // even with allowlisting — use a map instead
```

**Dynamic Identifiers (table/column names)**

SQL parameterization does not cover identifiers (table names, column names, sort directions). If any identifier must be dynamic:

```typescript
// Use an explicit allowlist map — never use user input directly
const ALLOWED_SORT_COLUMNS = new Map([
  ['date', 'received_at'],
  ['subject', 'subject'],
  ['from', 'from_address'],
]);

const sortColumn = ALLOWED_SORT_COLUMNS.get(userSortParam);
if (!sortColumn) throw new BadRequestError('Invalid sort parameter');

// Now safe to use sortColumn as identifier
const query = `SELECT * FROM emails WHERE tenant_id = $1 ORDER BY ${sortColumn}`;
```

**Enforcement**

Add an ESLint rule or custom lint check that rejects any pattern matching:
```
/db\.query\(`[^`]*\$\{/
/db\.query\("[^"]*\+/
```

---

### 2.3 Tenant Data Isolation

**Requirement:** Every database query that accesses tenant-scoped data MUST include a `tenant_id` predicate derived from the verified session/context — never from user-supplied request parameters.

**The core vulnerability to prevent:**

```typescript
// VULNERABLE — tenant_id comes from the request body
const tenantId = req.body.tenant_id;  // attacker sets this to another tenant
await db.query('SELECT * FROM imap_configs WHERE tenant_id = $1', [tenantId]);

// CORRECT — tenant_id comes from the verified session
const tenantId = req.session.tenantId;  // set during webhook validation
await db.query('SELECT * FROM imap_configs WHERE tenant_id = $1', [tenantId]);
```

**Database Schema Enforcement**

Use PostgreSQL Row-Level Security (RLS) as a defense-in-depth layer:

```sql
-- Enable RLS on every tenant-scoped table
ALTER TABLE imap_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Application connects as app_user, never as superuser
-- Set tenant context at connection time via session variable
CREATE POLICY tenant_isolation ON imap_configs
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- In application code, before each query in a transaction:
await db.query("SET LOCAL app.current_tenant_id = $1", [tenantId]);
```

**Application-Level Enforcement**

Create a `TenantContext` wrapper that every query function must pass through:

```typescript
// src/db/tenantQuery.ts
export async function tenantQuery(
  db: Pool,
  tenantId: string,
  sql: string,
  params: unknown[]
): Promise<QueryResult> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**Mandatory table columns**

Every user-facing table must have:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id),
```
with a composite index:
```sql
CREATE INDEX idx_imap_configs_tenant ON imap_configs (tenant_id);
```

**Cross-tenant query audit**

Write a test that verifies no query path exists that omits `tenant_id` filtering on scoped tables. This can be done with integration tests that provision two tenants and assert that tenant A's data is never accessible from tenant B's session.

---

### 2.4 Webhook Security

**Requirement:** The Telegram webhook endpoint MUST validate the `X-Telegram-Bot-Api-Secret-Token` header on every request before any processing occurs.

**Why this matters:** Without this check, any actor on the internet can send forged Telegram updates to your bot. This could trigger IMAP connections, expose user data, or exhaust rate limits.

**Implementation**

```typescript
// src/middleware/webhookAuth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { timingSafeEqual } from 'node:crypto';

const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!SECRET_TOKEN) throw new Error('TELEGRAM_WEBHOOK_SECRET is required');

const expectedBuf = Buffer.from(SECRET_TOKEN, 'utf8');

export async function validateWebhookSecret(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = req.headers['x-telegram-bot-api-secret-token'];

  if (typeof token !== 'string') {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  const receivedBuf = Buffer.from(token, 'utf8');

  // timingSafeEqual prevents timing attacks. Buffers must be equal length.
  if (
    receivedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(receivedBuf, expectedBuf)
  ) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
}
```

**Registering the webhook with the secret**

```typescript
await bot.telegram.setWebhook(WEBHOOK_URL, {
  secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
  allowed_updates: ['message', 'callback_query'],
  // Restrict to Telegram's IP ranges (optional but recommended)
  ip_address: undefined, // Set in firewall, not here
});
```

**Additional webhook hardening**

- Route the webhook to a non-guessable path: `/webhook/${randomHex}` where `randomHex` is a deploy-time random value stored as `WEBHOOK_PATH_SECRET`.
- Configure Fastify to reject bodies larger than 1 MB (`bodyLimit: 1_048_576`).
- Add a firewall rule (iptables / cloud security group) allowing port 443 inbound only from Telegram's IP ranges: `149.154.160.0/20` and `91.108.4.0/22`.

---

### 2.5 Rate Limiting Strategy

**Architecture:** Two-layer rate limiting — at the Fastify HTTP layer and within the bot command handler layer.

**Layer 1 — HTTP rate limiting (Fastify)**

```typescript
import rateLimit from '@fastify/rate-limit';

await fastify.register(rateLimit, {
  global: true,
  max: 100,               // requests per window
  timeWindow: '1 minute',
  keyGenerator: (req) => {
    // Key by Telegram user ID extracted from validated body, fall back to IP
    return req.telegramUserId ?? req.ip;
  },
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Slow down.',
  }),
});
```

**Layer 2 — Per-user bot command rate limiting**

```typescript
// src/middleware/botRateLimit.ts
// Use an in-memory LRU cache for single-instance; use Redis for multi-instance

import { LRUCache } from 'lru-cache';

const userWindows = new LRUCache<string, number[]>({
  max: 10_000,
  ttl: 60_000, // 1 minute TTL
});

const LIMITS = {
  search: { max: 10, windowMs: 60_000 },   // 10 searches per minute per user
  configure: { max: 5, windowMs: 300_000 }, // 5 config changes per 5 minutes
};

export function checkRateLimit(userId: string, action: keyof typeof LIMITS): boolean {
  const limit = LIMITS[action];
  const now = Date.now();
  const key = `${userId}:${action}`;

  const timestamps = (userWindows.get(key) ?? []).filter(
    (t) => now - t < limit.windowMs
  );

  if (timestamps.length >= limit.max) return false;

  timestamps.push(now);
  userWindows.set(key, timestamps);
  return true;
}
```

**Layer 3 — IMAP connection rate limiting**

Enforce a maximum of N concurrent IMAP connections per tenant to prevent credential stuffing amplification and to protect the mail server from appearing as an abusive client:

```typescript
const CONCURRENT_IMAP_PER_TENANT = 3;
const tenantImapSemaphores = new Map<string, Semaphore>();
```

---

### 2.6 Bot Token Protection

**Requirement:** The Telegram bot token MUST be treated as a production secret equivalent to a root password.

**Controls:**

1. **Storage:** Store only in environment variables or a secrets manager (Vault, AWS Secrets Manager, Docker Secrets). Never in source code, config files committed to git, or database.

2. **Access scope:** Only the Telegram client initialization module should read `process.env.TELEGRAM_BOT_TOKEN`. No other module should access it directly.

```typescript
// src/lib/telegram.ts — the ONLY place this is read
import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is required');

export const bot = new Telegraf(BOT_TOKEN);
```

3. **Rotation:** Document a runbook for token rotation. Telegram BotFather revokes tokens instantly. The rotation process should take less than 5 minutes.

4. **Git protection:** Add a pre-commit hook and CI check that scans for token patterns:
```bash
# .github/pre-commit or husky hook
if git diff --cached | grep -E '[0-9]{9,10}:[A-Za-z0-9_-]{35}'; then
  echo "ERROR: Possible Telegram bot token detected in staged changes"
  exit 1
fi
```

5. **Log scrubbing:** Ensure structured logging redacts fields named `token`, `bot_token`, `password`, `secret`. See Section 4.4.

---

## 3. Authentication & Authorization

### 3.1 Telegram User Identity Verification

**How Telegram identity works:** Telegram delivers user identity inside the update payload (`update.message.from.id`). This is not cryptographically signed per-message in webhooks — the integrity guarantee comes entirely from the webhook secret token (Section 2.4). Once you have validated the webhook secret, the `from.id` field is trustworthy.

**Do not rely on `from.username`** — usernames can be changed at any time. Always use `from.id` (a stable integer) as the canonical user identifier.

```typescript
// src/middleware/extractTelegramUser.ts
export function extractTelegramUser(ctx: Context): TelegramUser {
  const from = ctx.message?.from ?? ctx.callbackQuery?.from;
  if (!from) throw new Error('Update has no sender');

  return {
    telegramId: String(from.id),  // Store as string; JS integers lose precision above 2^53
    username: from.username,       // May be undefined; never use as identifier
    firstName: from.first_name,
  };
}
```

**Important:** Telegram user IDs are 64-bit integers. In JavaScript, store them as `string` or `BigInt` — `Number` will lose precision for large IDs.

### 3.2 Admin / Owner Permission Checks

**Principle of least privilege:** Three roles are defined. Each role is checked explicitly on each action — there is no role inheritance that could be exploited.

| Role | Capabilities | Storage |
|---|---|---|
| `master_admin` | Create/delete tenants, view all tenants, rotate keys | `MASTER_ADMIN_TELEGRAM_IDS` env var |
| `tenant_admin` | Configure IMAP, manage whitelist, view own tenant users | `tenant_admins` table |
| `tenant_user` | Search email (if whitelisted) | `tenant_users` table |

**Master admin check — env var, not database**

Master admin IDs are stored in the environment, not the database, so a database compromise cannot escalate privileges:

```typescript
// src/auth/roles.ts
const MASTER_ADMIN_IDS = new Set(
  (process.env.MASTER_ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
);

export function isMasterAdmin(telegramId: string): boolean {
  return MASTER_ADMIN_IDS.has(telegramId);
}
```

**Tenant admin check — database, scoped by tenant**

```typescript
export async function isTenantAdmin(
  db: Pool,
  tenantId: string,
  telegramId: string
): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM tenant_admins
     WHERE tenant_id = $1 AND telegram_id = $2 AND active = true`,
    [tenantId, telegramId]
  );
  return result.rowCount > 0;
}
```

**Authorization middleware pattern**

```typescript
// Require tenant admin for configuration commands
bot.command('configure', requireTenantAdmin, handleConfigure);
bot.command('whitelist', requireTenantAdmin, handleWhitelist);

// Require whitelisted user for search
bot.on('message', requireWhitelistedUser, handleSearch);

async function requireTenantAdmin(ctx: Context, next: () => Promise<void>) {
  const user = extractTelegramUser(ctx);
  const tenantId = await resolveTenantForChat(ctx.chat.id);

  if (!tenantId) {
    await ctx.reply('This bot is not configured for this chat.');
    return;
  }

  const isAdmin = await isTenantAdmin(db, tenantId, user.telegramId);
  if (!isAdmin) {
    await ctx.reply('You do not have permission to use this command.');
    return;
  }

  ctx.state.tenantId = tenantId;
  ctx.state.telegramUser = user;
  await next();
}
```

### 3.3 Master vs Tenant Admin Separation

```
Master Admin (env var IDs)
├── Can create a new tenant (assigns bot token to chat group)
├── Can delete a tenant (removes all tenant data)
├── Can view a list of all tenants (no credential access)
└── CANNOT access IMAP credentials of any tenant

Tenant Admin (database, per tenant)
├── Can set/update IMAP credentials (encrypted at rest)
├── Can manage user whitelist for their tenant
├── Can set search filter regex patterns
└── CANNOT access another tenant's data or configuration
```

**Separation enforcement:** Functions that handle tenant admin operations must accept a `tenantId` parameter derived from verified context — not from user input — and must assert that the requesting user is admin for that specific tenant, not any tenant.

### 3.4 Whitelist Enforcement

**Requirement:** Whitelist checks MUST occur at the middleware layer before any IMAP connection is initiated.

```typescript
export async function requireWhitelistedUser(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const user = extractTelegramUser(ctx);
  const tenantId = ctx.state.tenantId;  // Set by preceding middleware

  const result = await db.query(
    `SELECT 1 FROM tenant_users
     WHERE tenant_id = $1
       AND telegram_id = $2
       AND whitelisted = true
       AND active = true`,
    [tenantId, user.telegramId]
  );

  if (result.rowCount === 0) {
    await ctx.reply('You are not authorized to use this service.');
    return;  // Do NOT call next()
  }

  await next();
}
```

**Fail-closed:** If the database query fails, the user is NOT permitted. Log the error server-side; return a generic "service unavailable" message to the user.

---

## 4. Secure Coding Requirements

### 4.1 Input Validation

**Email address validation**

Use a strict, well-tested email validation library. Do not write a custom email regex — RFC 5322 is notoriously complex and hand-rolled regexes are routinely bypassable.

```typescript
import { z } from 'zod';

const EmailSearchSchema = z.object({
  email: z
    .string()
    .min(1)
    .max(254)          // RFC 5321 max email length
    .email()           // zod's built-in validation
    .transform((e) => e.toLowerCase().trim()),
});

export function parseEmailInput(raw: string): string {
  const result = EmailSearchSchema.safeParse({ email: raw });
  if (!result.success) {
    throw new ValidationError('Invalid email address format');
  }
  return result.data.email;
}
```

**Admin-supplied regex patterns**

Tenant admins can configure search filter patterns. These patterns are applied to email content and therefore represent a ReDoS (Regular Expression Denial of Service) risk and a potential injection vector.

```typescript
import RE2 from 're2';  // Google's RE2 — guaranteed linear time, no ReDoS

const MAX_REGEX_LENGTH = 200;
const MAX_REGEX_COUNT_PER_TENANT = 20;

export function validateAndCompilePattern(pattern: string): RE2 {
  if (pattern.length > MAX_REGEX_LENGTH) {
    throw new ValidationError(`Pattern too long (max ${MAX_REGEX_LENGTH} chars)`);
  }

  try {
    // RE2 will reject patterns that could cause catastrophic backtracking
    return new RE2(pattern);
  } catch (err) {
    throw new ValidationError('Invalid or unsupported regex pattern');
  }
}
```

**Install:** `npm install re2`

**IMAP hostname validation**

When tenant admins provide IMAP server hostnames, validate them to prevent SSRF (Server-Side Request Forgery):

```typescript
import { isIP } from 'node:net';

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12
  /^::1$/,
  /^169\.254\./,                   // Link-local
  /^0\./,
];

export function validateImapHost(host: string): void {
  const trimmed = host.trim().toLowerCase();

  if (trimmed.length === 0 || trimmed.length > 253) {
    throw new ValidationError('Invalid IMAP host');
  }

  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new ValidationError('IMAP host points to a private or reserved address');
    }
  }
}

export function validateImapPort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ValidationError('Invalid IMAP port');
  }
  // Warn if not standard IMAP ports
  if (![143, 993].includes(port)) {
    // Log a warning — don't block, some servers use custom ports
  }
}
```

### 4.2 IMAP Connection Security

**Requirement:** All IMAP connections MUST use TLS. Plaintext IMAP (port 143 without STARTTLS) is prohibited.

```typescript
import Imap from 'imap';  // or 'imapflow'

export function createImapConnection(config: ImapConfig): Imap {
  const { host, port, username, passwordEncrypted } = config;

  const password = decryptPassword(passwordEncrypted);

  return new Imap({
    user: username,
    password,
    host,
    port,
    tls: true,                  // REQUIRED — always TLS
    tlsOptions: {
      rejectUnauthorized: true, // REQUIRED — validate server cert; never set to false
      minVersion: 'TLSv1.2',   // Reject TLS 1.0 and 1.1
      servername: host,         // Required for SNI with shared hosting
    },
    authTimeout: 5000,          // 5 second auth timeout
    connTimeout: 10000,         // 10 second connection timeout
  });
}
```

**Never allow `rejectUnauthorized: false`** — this disables certificate validation and makes TLS useless against MITM. If a tenant's mail server uses a self-signed certificate, they must provide the CA certificate explicitly:

```typescript
// Only allow this if tenant has explicitly provided a trusted CA cert
tlsOptions: {
  rejectUnauthorized: true,
  ca: config.customCaCert ?? undefined,
}
```

**Connection lifecycle**

```typescript
export async function withImapConnection<T>(
  config: ImapConfig,
  fn: (imap: Imap) => Promise<T>
): Promise<T> {
  const imap = createImapConnection(config);

  return new Promise((resolve, reject) => {
    imap.once('ready', async () => {
      try {
        const result = await fn(imap);
        imap.end();
        resolve(result);
      } catch (err) {
        imap.destroy();
        reject(err);
      }
    });

    imap.once('error', (err) => {
      reject(new ImapConnectionError('IMAP connection failed'));
      // Do NOT propagate err directly — it may contain server banners with sensitive info
    });

    // Hard timeout — never leave a connection open indefinitely
    const timeout = setTimeout(() => {
      imap.destroy();
      reject(new ImapConnectionError('IMAP connection timed out'));
    }, 30_000);

    imap.once('end', () => clearTimeout(timeout));

    imap.connect();
  });
}
```

### 4.3 Error Messages — Do Not Leak Sensitive Information

**Principle:** Internal error details (stack traces, database errors, IMAP server banners, SQL queries) MUST never reach the end user or external API response.

**Error handling architecture**

```typescript
// src/errors.ts — define user-facing error types
export class UserFacingError extends Error {
  constructor(
    public readonly userMessage: string,   // Safe to show user
    public readonly internalMessage: string, // Logged server-side only
    public readonly statusCode: number = 400
  ) {
    super(internalMessage);
  }
}

export class ImapConnectionError extends UserFacingError {
  constructor(internal: string) {
    super(
      'Unable to connect to the mail server. Please contact your administrator.',
      internal
    );
  }
}

export class ValidationError extends UserFacingError {
  constructor(message: string) {
    super(message, message, 400); // Validation errors are safe to surface
  }
}
```

**Fastify global error handler**

```typescript
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof UserFacingError) {
    request.log.warn({ internalMessage: error.internalMessage }, 'User-facing error');
    reply.code(error.statusCode).send({ error: error.userMessage });
  } else {
    // Unknown error — log full details, return generic message
    request.log.error({ err: error, stack: error.stack }, 'Unhandled error');
    reply.code(500).send({ error: 'An internal error occurred.' });
  }
});
```

**Bot error handler**

```typescript
bot.catch((err, ctx) => {
  logger.error({ err, updateType: ctx.updateType }, 'Bot error');
  ctx.reply('An error occurred. Please try again later.').catch(() => {});
  // Never include err.message in the reply
});
```

**Specific things that MUST NOT appear in user-facing messages:**
- SQL error text (table names, column names, constraint names)
- IMAP server banners or authentication error strings
- Stack traces
- File system paths
- Internal IP addresses or hostnames
- Encryption error details

### 4.4 Logging — What NOT to Log

**Never log these fields, regardless of log level:**

| Field | Reason |
|---|---|
| IMAP passwords (plaintext or encrypted) | Credential exposure |
| Telegram bot token | Full bot compromise |
| Webhook secret token | Forged update delivery |
| `IMAP_ENCRYPTION_KEY` | All credentials compromised |
| Email body content returned from IMAP | PII / confidential data |
| Full email address of search queries | PII |
| PostgreSQL connection string | Credential exposure |
| Full HTTP request bodies on webhook route | Contains Telegram user messages |

**Structured log sanitization**

```typescript
import pino from 'pino';

const REDACTED_PATHS = [
  'password',
  'password_encrypted',
  'bot_token',
  'secret',
  'secret_token',
  'encryption_key',
  'imap_password',
  'body.message.text',  // Telegram message content
  'req.body',           // Full request body on webhook
];

export const logger = pino({
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
  level: process.env.LOG_LEVEL ?? 'info',
});
```

**What IS safe to log:**
- Telegram user ID (not username)
- Tenant ID
- Action type (search, configure, etc.)
- Timestamps
- Request IDs / correlation IDs
- Error codes and sanitized error messages
- IMAP connection status (success/failure, not the error text)
- Rate limit events

**Log retention:** Production logs containing Telegram user IDs are personal data under GDPR. Set log retention to the minimum required (30–90 days is typical). Do not ship logs to third-party aggregators without a DPA in place.

---

## 5. Docker & Deployment Security

### 5.1 Non-Root User in Dockerfile

Running as root inside a container is dangerous because a container escape vulnerability would give the attacker root on the host. Always run as a dedicated non-root user.

```dockerfile
# Dockerfile
FROM node:22-alpine AS base

# Create a non-root user with no shell and no home directory write access
RUN addgroup --system --gid 1001 koalavault && \
    adduser --system --uid 1001 --ingroup koalavault --no-create-home koalavault

WORKDIR /app

# Install dependencies as root (needed for npm install)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY --chown=koalavault:koalavault . .

# Build step (if TypeScript)
RUN npm run build

# Drop to non-root user for runtime
USER koalavault

# Expose only the application port
EXPOSE 3000

# Use exec form to avoid shell PID 1 issues and ensure signal handling
CMD ["node", "dist/index.js"]
```

**Additional Dockerfile hardening:**

```dockerfile
# Use specific digest pinning for the base image in production
# Prevents supply chain attacks via mutable tags
FROM node:22-alpine@sha256:<specific-digest> AS base

# Make the filesystem read-only except for specific writable paths
# (set in docker-compose or K8s — not possible in Dockerfile alone)
```

### 5.2 Environment Variable Handling

**Principle:** Sensitive environment variables must never appear in:
- Docker image layers (`docker history` would reveal them)
- `docker-compose.yml` committed to git
- CI/CD build logs
- Process listings (`/proc/*/environ` is readable by the running user)

**docker-compose.yml — reference secrets, never embed values**

```yaml
# docker-compose.yml — safe to commit
version: '3.9'

services:
  bot:
    image: koalavault:latest
    env_file:
      - .env          # .env is NOT committed — see .gitignore
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    read_only: true   # Read-only root filesystem
    tmpfs:
      - /tmp:size=50m,mode=1777
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation via setuid binaries
    cap_drop:
      - ALL            # Drop all Linux capabilities
    cap_add:
      - NET_BIND_SERVICE  # Only add back what's needed
    user: "1001:1001"
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    secrets:
      - pg_password
    networks:
      - internal      # DB is on internal network only — not exposed

networks:
  internal:
    internal: true    # No external connectivity for DB

secrets:
  pg_password:
    file: ./secrets/pg_password.txt  # Not committed
```

### 5.3 .env File Security

```bash
# .gitignore — must include these entries
.env
.env.*
!.env.example    # The example file (with placeholder values) IS committed
secrets/
*.key
*.pem
```

**`.env.example` — committed to git with safe placeholder values only**

```bash
# .env.example — committed to git
# Copy to .env and fill in real values. NEVER commit .env

TELEGRAM_BOT_TOKEN=<bot-token-from-botfather>
TELEGRAM_WEBHOOK_SECRET=<random-32-char-hex>
WEBHOOK_PATH_SECRET=<random-16-char-hex>
DATABASE_URL=postgresql://app_user:<password>@localhost:5432/koalavault
IMAP_ENCRYPTION_KEY=<64-char-hex-from-keygen>
MASTER_ADMIN_TELEGRAM_IDS=<comma-separated-telegram-ids>
LOG_LEVEL=info
NODE_ENV=production
```

**On the server:** Use a secrets manager where possible. If using plain `.env` files:

```bash
# On the production server only
chmod 600 /app/.env
chown koalavault:koalavault /app/.env

# Verify .env is not world-readable
ls -la /app/.env
# Should show: -rw------- 1 koalavault koalavault ...
```

**Detect accidental commits:**

```bash
# Install git-secrets or trufflehog in CI
# Example: trufflehog scan on every push
trufflehog git file://. --only-verified --fail
```

### 5.4 GitHub Actions Secrets

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production    # Requires approval gate for production env

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t koalavault:${{ github.sha }} .
        # Do NOT pass secrets as build args — they appear in docker history
        # WRONG:  --build-arg BOT_TOKEN=${{ secrets.BOT_TOKEN }}
        # RIGHT:  Pass secrets at runtime via env_file or Docker secrets

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            docker pull koalavault:${{ github.sha }}
            docker-compose up -d --no-build
        # The .env file is already on the server — not transmitted through CI

      - name: Scan for secrets in source
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          extra_args: --only-verified
```

**GitHub Actions security settings:**
- Enable `ACTIONS_RUNNER_DEBUG` only in non-production environments — debug mode can echo secrets.
- Set `permissions: {}` at the workflow level and grant only the minimum needed (`contents: read`).
- Use environment protection rules with required reviewers for production deployments.
- Rotate `DEPLOY_SSH_KEY` periodically and use a dedicated deploy key (not a personal key).

---

## 6. Recommendations & Implementation Guide

### 6.1 Required Environment Variables

All of the following MUST be present and non-empty at startup. The application MUST fail to start if any are missing.

```typescript
// src/config.ts — validate at startup, not at first use
const REQUIRED_ENV_VARS = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'WEBHOOK_PATH_SECRET',
  'DATABASE_URL',
  'IMAP_ENCRYPTION_KEY',
  'MASTER_ADMIN_TELEGRAM_IDS',
] as const;

export function validateConfig(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate key format
  if (!/^[0-9a-f]{64}$/.test(process.env.IMAP_ENCRYPTION_KEY!)) {
    throw new Error('IMAP_ENCRYPTION_KEY must be a 64-character lowercase hex string');
  }

  // Validate webhook secret length (Telegram requires 1-256 chars, alphanumeric + underscore)
  if (!/^[A-Za-z0-9_]{1,256}$/.test(process.env.TELEGRAM_WEBHOOK_SECRET!)) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET must be 1-256 alphanumeric/underscore characters');
  }
}

// Called at the very top of src/index.ts, before any other initialization
validateConfig();
```

### 6.2 Fastify Security Middleware Stack

Register these plugins in order at server startup:

```typescript
import fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';

const app = fastify({
  logger: true,
  bodyLimit: 1_048_576,           // 1 MB max body
  trustProxy: true,               // Required if behind nginx/load balancer
  requestTimeout: 30_000,         // 30s request timeout
});

// 1. Security headers
await app.register(helmet, {
  contentSecurityPolicy: false,   // Not serving HTML
  hsts: {
    maxAge: 31_536_000,
    includeSubDomains: true,
  },
});

// 2. CORS — restrict to no origin (webhook is server-to-server)
await app.register(cors, {
  origin: false,  // No browser-based cross-origin requests permitted
});

// 3. Rate limiting
await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute',
});

// 4. Webhook route — apply secret validation before anything else
app.post(
  `/webhook/${process.env.WEBHOOK_PATH_SECRET}`,
  { preHandler: [validateWebhookSecret] },
  webhookHandler
);
```

### 6.3 Database Security Checklist

```sql
-- 1. Create a dedicated application user with minimal privileges
CREATE USER app_user WITH PASSWORD '<strong-random-password>';

-- 2. Grant only necessary permissions — no CREATE, DROP, ALTER
GRANT CONNECT ON DATABASE koalavault TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 3. Revoke superuser-equivalent privileges
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- 4. Enable RLS on all tenant-scoped tables
ALTER TABLE imap_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- 5. SSL connections only (in postgresql.conf)
-- ssl = on
-- ssl_cert_file = 'server.crt'
-- ssl_key_file = 'server.key'
```

### 6.4 Security Test Requirements

The following test categories are required before production deployment:

**Unit tests:**
- `encryptPassword` / `decryptPassword` round-trip
- `decryptPassword` throws on tampered ciphertext (GCM authentication failure)
- `validateImapHost` blocks all RFC 1918 and loopback addresses
- `validateAndCompilePattern` rejects oversized and unsupported patterns
- `parseEmailInput` rejects invalid email formats

**Integration tests:**
- Tenant A cannot access tenant B's IMAP credentials or search results
- Unauthenticated webhook requests (missing/wrong secret) return 401
- Rate limit triggers after N requests return 429
- Non-whitelisted users cannot trigger IMAP connections
- Non-admin users cannot call configuration commands

**Security-specific tests:**
- SQL injection payloads in email search input do not cause errors or return unexpected data
- SSRF attempt via IMAP host field is rejected
- ReDoS patterns in admin-configured regex do not hang the process (use RE2)

### 6.5 Pre-Deployment Security Checklist

```
[ ] IMAP_ENCRYPTION_KEY generated with `crypto.randomBytes(32)`, stored in secrets manager
[ ] TELEGRAM_WEBHOOK_SECRET generated with `crypto.randomBytes(16).toString('hex')`
[ ] WEBHOOK_PATH_SECRET generated and webhook URL registered with Telegram
[ ] .env file has chmod 600 on production server
[ ] .env is in .gitignore and confirmed absent from git history
[ ] Docker container runs as UID 1001 (verified with `docker exec <id> id`)
[ ] PostgreSQL not bound to 0.0.0.0 (verify with `ss -tlnp | grep 5432`)
[ ] Telegram IP allowlist applied at firewall level
[ ] MASTER_ADMIN_TELEGRAM_IDS set to real admin IDs (not test IDs)
[ ] NODE_ENV=production (disables stack traces in error responses)
[ ] Log level set to 'info' (not 'debug' in production)
[ ] Secret scanner (trufflehog) integrated into CI pipeline
[ ] Dependency audit passing: `npm audit --audit-level=high`
[ ] Container image scanned: `trivy image koalavault:latest`
```

### 6.6 Dependency Recommendations

| Purpose | Recommended Package | Reason |
|---|---|---|
| Schema validation | `zod` | Type-safe, composable, good error messages |
| Regex safety | `re2` | Linear-time matching, no ReDoS |
| HTTP security headers | `@fastify/helmet` | Maintained, covers HSTS, CSP, etc. |
| Rate limiting | `@fastify/rate-limit` | Native Fastify integration |
| Structured logging | `pino` | Built into Fastify; supports redaction |
| Secret scanning (CI) | `trufflehog` | Verified secrets only; low false positive rate |
| Container scanning | `trivy` | Free, comprehensive CVE database |
| IMAP client | `imapflow` | Modern, promise-based, TLS-first |

### 6.7 Known Risks Accepted vs Mitigated

| Risk | Mitigation | Residual Risk |
|---|---|---|
| IMAP credential theft via DB breach | AES-256-GCM encryption at app layer | Key compromise exposes all credentials |
| Tenant data crossover | RLS + tenantId in every query + integration tests | Logic error in new query paths |
| Bot impersonation | Webhook secret + HTTPS | Telegram platform compromise |
| ReDoS via admin regex | RE2 library | RE2 bugs (extremely rare) |
| SSRF via IMAP host | Host validation + private IP blocklist | DNS rebinding attacks (mitigate with short TTL resolution) |
| Email content PII | Never persist; in-memory only | Memory dumps, coredumps — disable coredumps in production |

---

*This document should be reviewed and updated whenever the threat model changes, new features are added that affect authentication or data access, or when dependencies receive major security updates.*
