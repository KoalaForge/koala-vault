import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { ImapConfig } from '../types'
import { logger } from '../logger'
import { withImapRetry } from './withImapRetry'

export interface FoundEmail {
  body: string
  html: string
  subject: string
  date: Date | null
}

class SearchEmailsForBatch {
  /**
   * Opens ONE IMAP connection and searches for emails addressed to each
   * toAddress. Reusing a single connection eliminates N-1 TCP+TLS handshakes
   * when multiple email addresses share the same IMAP credentials.
   */
  async execute(
    imapConfig: ImapConfig,
    subjectKeywords: string[],
    toAddresses: string[],
  ): Promise<Map<string, FoundEmail[]>> {
    const label = `batch:${imapConfig.host}:${imapConfig.auth.user}`
    return withImapRetry(label, () => this.connectAndSearch(imapConfig, subjectKeywords, toAddresses))
  }

  private async connectAndSearch(
    imapConfig: ImapConfig,
    subjectKeywords: string[],
    toAddresses: string[],
  ): Promise<Map<string, FoundEmail[]>> {
    const client = new ImapFlow({
      host: imapConfig.host,
      port: imapConfig.port,
      secure: imapConfig.secure,
      auth: imapConfig.auth,
      logger: false,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      const results = new Map<string, FoundEmail[]>()

      for (const toAddress of toAddresses) {
        const emails = await this.searchForAddress(client, subjectKeywords, toAddress)
        results.set(toAddress, emails)
      }

      return results
    } finally {
      lock.release()
      await client.logout()
    }
  }

  private async searchForAddress(
    client: ImapFlow,
    subjectKeywords: string[],
    toAddress: string,
  ): Promise<FoundEmail[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    logger.info({ toAddress, subjects: subjectKeywords, since }, 'IMAP batch: searching address')

    const toUidSets: number[][] = []
    const fromUidSets: number[][] = []

    for (const subject of subjectKeywords) {
      const toUids = await client.search({ subject, since, to: toAddress })
        .catch((err) => {
          logger.warn({ err, subject, toAddress }, 'IMAP batch: subject search (to) failed, skipping')
          return [] as number[]
        })
      const fromUids = await client.search({ subject, since, from: toAddress })
        .catch((err) => {
          logger.warn({ err, subject, toAddress }, 'IMAP batch: subject search (from) failed, skipping')
          return [] as number[]
        })

      logger.info({ subject, toAddress, toUids, fromUids }, 'IMAP batch: search results by field')

      toUidSets.push(toUids)
      fromUidSets.push(fromUids)
    }

    const allToUids = toUidSets.flat().filter((uid): uid is number => typeof uid === 'number')
    const allFromUids = fromUidSets.flat().filter((uid): uid is number => typeof uid === 'number')
    const onlyFrom = allFromUids.filter(uid => !allToUids.includes(uid))
    const onlyTo = allToUids.filter(uid => !allFromUids.includes(uid))
    const both = allToUids.filter(uid => allFromUids.includes(uid))

    logger.info({ toAddress, onlyTo, onlyFrom, both }, 'IMAP batch: UID source breakdown')

    const allUids = [...new Set([...allToUids, ...allFromUids])]
    const recentUids = allUids.slice(-5)

    logger.info({ toAddress, totalUids: allUids.length, fetching: recentUids.length }, 'IMAP batch: UIDs found')

    if (recentUids.length === 0) return []

    const buffers: Buffer[] = []
    for await (const msg of client.fetch(recentUids, { source: true })) {
      if (msg.source) buffers.push(msg.source)
    }

    logger.info({ toAddress, buffersCollected: buffers.length }, 'IMAP batch: raw messages collected')

    const parsed = await Promise.all(buffers.map(buf => this.parseMessage(buf)))
    const valid = parsed.filter((m): m is FoundEmail => m !== null)

    logger.info(
      { toAddress, parsed: valid.length, subjects: valid.map(m => m.subject), bodyLengths: valid.map(m => m.body.length), htmlLengths: valid.map(m => m.html.length) },
      'IMAP batch: messages parsed',
    )

    return valid
  }

  private async parseMessage(source: Buffer): Promise<FoundEmail | null> {
    try {
      const parsed = await simpleParser(source)
      return {
        body: String(parsed.text || ''),
        html: String(parsed.html || ''),
        subject: String(parsed.subject || ''),
        date: parsed.date ?? null,
      }
    } catch {
      return null
    }
  }
}

export const searchEmailsForBatch = new SearchEmailsForBatch()
