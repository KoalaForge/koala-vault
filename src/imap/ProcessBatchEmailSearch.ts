import type { Category, EmailSearchResult, ImapConfig, SessionEmailEntry } from '../types'
import { resolveImapConfig } from './ResolveImapConfig'
import { searchEmailsForBatch } from './SearchEmailsForBatch'
import type { FoundEmail } from './SearchEmailsForBatch'
import { extractContentFromEmail } from './ExtractContentFromEmail'
import { logger } from '../logger'

interface ConfigGroup {
  config: ImapConfig
  entries: SessionEmailEntry[]
}

class ProcessBatchEmailSearch {
  /**
   * Searches all email addresses in a single batch.
   *
   * Addresses that share the same IMAP credentials (same host + auth.user)
   * are grouped into one connection — eliminating redundant TCP+TLS handshakes.
   * Distinct IMAP servers are searched concurrently.
   */
  async execute(
    tenantId: string,
    entries: SessionEmailEntry[],
    category: Category,
  ): Promise<EmailSearchResult[]> {
    const startTime = Date.now()

    // Resolve all IMAP configs in parallel
    const resolved = await Promise.all(
      entries.map(async entry => ({
        entry,
        config: await resolveImapConfig.execute(tenantId, entry.emailAddress, entry.provider),
      }))
    )

    // Separate unresolvable addresses immediately
    const noConfig = new Set<string>()
    const groups = new Map<string, ConfigGroup>()

    for (const { entry, config } of resolved) {
      if (!config) {
        logger.warn(
          { emailAddress: entry.emailAddress, tenantId },
          'IMAP batch: no config found — use /setimap or /setprovider',
        )
        noConfig.add(entry.emailAddress)
        continue
      }

      // Fingerprint = host:port:user — same credentials = same connection
      const fingerprint = `${config.host}:${config.port}:${config.auth.user}`
      if (!groups.has(fingerprint)) {
        groups.set(fingerprint, { config, entries: [] })
      }
      groups.get(fingerprint)!.entries.push(entry)
    }

    logger.info(
      {
        totalAddresses: entries.length,
        configGroups: groups.size,
        noConfig: noConfig.size,
      },
      'IMAP batch: grouped by config',
    )

    // Search each group concurrently (different IMAP servers in parallel)
    const foundEmailsMap = new Map<string, FoundEmail[]>()

    await Promise.all(
      [...groups.values()].map(async ({ config, entries: groupEntries }) => {
        const toAddresses = groupEntries.map(e => e.emailAddress)

        logger.info(
          { host: config.host, addressCount: toAddresses.length },
          'IMAP batch: connecting for group',
        )

        const batchResult = await searchEmailsForBatch.execute(
          config,
          category.subjectKeywords,
          toAddresses,
        )

        for (const [addr, emails] of batchResult) {
          foundEmailsMap.set(addr, emails)
        }
      })
    )

    // Build final results in original order
    return entries.map(entry => {
      if (noConfig.has(entry.emailAddress)) {
        return {
          emailAddress: entry.emailAddress,
          status: 'not_found' as const,
          extractedContent: null,
          emailTime: null,
          fetchDurationMs: Date.now() - startTime,
        }
      }

      const emails = foundEmailsMap.get(entry.emailAddress) ?? []
      const { content, emailDate } = extractContentFromEmail.execute(emails, category.extractionRegex)

      return {
        emailAddress: entry.emailAddress,
        status: content ? 'found' as const : 'not_found' as const,
        extractedContent: content,
        emailTime: emailDate,
        fetchDurationMs: Date.now() - startTime,
      }
    })
  }
}

export const processBatchEmailSearch = new ProcessBatchEmailSearch()
