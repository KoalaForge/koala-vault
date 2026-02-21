# KoalaVault 🐨

Multi-tenant Telegram bot for IMAP email searching. Built with Node.js, TypeScript, Telegraf, Fastify, and MongoDB.

## Architecture

- **Multi-tenant**: Each tenant has their own bot token and isolated data
- **Webhook**: Fastify serves all bot webhooks at `/webhook/:secret/:botToken`
- **IMAP Search**: Searches emails by subject keywords, extracts content via regex
- **Whitelist**: Per-tenant access control with admin approval flow

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Bot**: Telegraf v4 (webhook mode)
- **Server**: Fastify
- **Database**: MongoDB 7 (Mongoose ODM)
- **IMAP**: imapflow + mailparser
- **Encryption**: AES-256-GCM (Node.js crypto)

## Setup

### Local Development

1. Copy `.env.example` to `.env` and fill in values:
   ```bash
   cp .env.example .env
   ```

2. Generate encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Start with Docker Compose:
   ```bash
   docker compose up
   ```

4. For local dev without Docker:
   ```bash
   npm install
   npm run dev
   ```

### Production Deployment

Deploy to `/home/koalastore/koala-vault` on the server. GitHub Actions handles CI/CD on push to `main`.

Required GitHub Secrets:
- `SSH_HOST` - Server IP/hostname
- `SSH_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key
- `SSH_PORT` - SSH port (optional, default 22)

## Bot Commands

### User Commands
- `/start` - Start the bot and enter email collection mode

### Admin Commands (Owner only)
- `/addcategory` - Add a search category (multi-line format)
- `/listcategories` - List all categories
- `/deletecategory <id>` - Delete a category
- `/setimap` - Set per-email IMAP config
- `/setprovider` - Set provider default (gmail/outlook/etc)
- `/listimap` - List all IMAP configs
- `/users` - List all users and their whitelist status
- `/whitelist <user_id>` - Add user to whitelist
- `/unwhitelist <user_id>` - Remove user from whitelist
- `/togglewhitelist` - Toggle whitelist on/off

### Master Commands (Master owner only)
- `/addtenant` - Add a new tenant bot
- `/listtenant` - List all tenants
- `/deactivatetenant <id>` - Deactivate a tenant

## IMAP Config Priority

1. Per-address override (exact email match)
2. Provider default (gmail, outlook, yahoo, icloud)
3. Not found → "not found" result

## Design Principles

- **1 class = 1 public method** (Command/Query pattern)
- **No nested if/loops** (guard clauses + array methods)
- **SOLID** principles throughout
- **SoC** - each file has one responsibility
