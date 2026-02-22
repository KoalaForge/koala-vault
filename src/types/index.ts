import type { Context, Scenes } from 'telegraf'
import type { Types } from 'mongoose'

// ─── Enums ─────────────────────────────────────────────────────────────────

export type SessionState =
  | 'AWAITING_EMAILS'
  | 'AWAITING_CATEGORY'
  | 'SEARCHING'
  | 'RESULTS_SHOWN'
  | 'COMPLETED'

export type WhitelistStatus = 'pending' | 'approved' | 'denied'

export type ImapProvider = 'gmail'

export type ResultStatus = 'found' | 'not_found' | 'error' | 'in_progress'

// ─── Domain Objects ────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  name: string
  botToken: string
  ownerTelegramId: string
  isMaster: boolean
  isActive: boolean
  whitelistEnabled: boolean
  webhookUrl: string | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ImapProviderDefault {
  id: string
  tenantId: string
  provider: ImapProvider
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  passwordEncrypted: string
  createdAt: Date
  updatedAt: Date
}

export interface ImapAddressOverride {
  id: string
  tenantId: string
  emailAddress: string
  imapHost: string
  imapPort: number
  useSsl: boolean
  username: string
  passwordEncrypted: string
  createdAt: Date
  updatedAt: Date
}

export interface ImapConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface Category {
  id: string
  tenantId: string
  name: string
  slug: string
  subjectKeywords: string[]
  extractionRegexList: string[]
  displayOrder: number
  isActive: boolean
  isGlobal: boolean
  isDefault: boolean
  defaultForTenants: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CategoryAssignment {
  id: string
  tenantId: string
  telegramUserId: string
  categoryId: string
  assignedByTelegramId: string
  createdAt: Date
}

export interface WhitelistEntry {
  id: string
  tenantId: string
  telegramUserId: string
  telegramUsername: string | null
  status: WhitelistStatus
  approvedByTelegramId: string | null
  createdAt: Date
  resolvedAt: Date | null
}

export interface RegisteredEmail {
  id: string
  tenantId: string
  emailAddress: string
  provider: string
  addedByTelegramId: string
  createdAt: Date
}

export interface EmailAssignment {
  id: string
  tenantId: string
  telegramUserId: string
  emailAddress: string
  provider: string
  expiresAt: Date | null
  assignedByTelegramId: string
  createdAt: Date
}

export interface SessionEmailEntry {
  emailAddress: string
  provider: string | null
}

export interface EmailResult {
  status: ResultStatus
  extractedContent: string | null
  errorReason: string | null
  searchedAt: string | null
  retryCount: number
}

export interface UserSession {
  id: string
  tenantId: string
  telegramUserId: string
  state: SessionState
  emailAddresses: SessionEmailEntry[]
  selectedCategoryId: string | null
  results: Record<string, EmailResult>
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export interface AccessRequest {
  id: string
  tenantId: string
  telegramUserId: string
  telegramUsername: string | null
  telegramFirstName: string | null
  status: WhitelistStatus
  adminMessageId: number | null
  createdAt: Date
  resolvedAt: Date | null
  resolvedByTelegramId: string | null
}

// ─── Application Config ────────────────────────────────────────────────────

export interface AppConfig {
  nodeEnv: string
  port: number
  webhookBaseUrl: string
  webhookPathSecret: string
  databaseUrl: string
  imapEncryptionKey: string
  telegramWebhookSecret: string
  masterBotToken: string
  masterOwnerTelegramId: string
  logLevel: string
}

// ─── Bot Context ───────────────────────────────────────────────────────────

export interface TenantContext {
  tenant: Tenant
  session: UserSession | null
}

export type BotContext = Context & {
  tenantContext: TenantContext
  scene: Scenes.SceneContextScene<BotContext>
  match?: RegExpMatchArray | RegExpExecArray
}

// ─── Search Results ────────────────────────────────────────────────────────

export type ImapErrorReason = 'auth_failed' | 'connection_error'

export interface EmailSearchResult {
  emailAddress: string
  status: ResultStatus
  extractedContent: string | null
  emailTime: Date | null
  fetchDurationMs: number
  errorReason?: ImapErrorReason
}
