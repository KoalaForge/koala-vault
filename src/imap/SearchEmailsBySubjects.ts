import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { ImapConfig } from '../types'
import { logger } from '../logger'
import { withImapRetry } from './withImapRetry'

interface FoundEmail {
  body: string
  html: string
  subject: string
  date: Date | null
}

class SearchEmailsBySubjects {
  async execute(
    imapConfig: ImapConfig,
    subjectKeywords: string[],
    toAddress: string,
  ): Promise<FoundEmail[]> {
    const label = `single:${imapConfig.host}:${toAddress}`
    return withImapRetry(label, () => this.connectAndSearch(imapConfig, subjectKeywords, toAddress))
  }

  private async connectAndSearch(
    imapConfig: ImapConfig,
    subjectKeywords: string[],
    toAddress: string,
  ): Promise<FoundEmail[]> {
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
      const messages = await this.searchAllSubjects(client, subjectKeywords, toAddress)
      const parsed = await Promise.all(messages.map(msg => this.parseMessage(msg)))
      return parsed.filter((m): m is FoundEmail => m !== null)
    } finally {
      lock.release()
      await client.logout()
    }
  }

  private async searchAllSubjects(
    client: ImapFlow,
    subjects: string[],
    toAddress: string,
  ): Promise<Buffer[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    logger.info({ subjects, toAddress, since }, 'IMAP: searching with criteria')

    const searchResults = await Promise.all(
      subjects.flatMap(subject => [
        client.search({ subject, since, to: toAddress })
          .catch((err) => {
            logger.warn({ err, subject, toAddress }, 'IMAP: subject search (to) failed, skipping')
            return [] as number[]
          }),
        client.search({ subject, since, from: toAddress })
          .catch((err) => {
            logger.warn({ err, subject, toAddress }, 'IMAP: subject search (from) failed, skipping')
            return [] as number[]
          }),
      ])
    )

    const flatUids = searchResults.flat()
    const allUids = [...new Set(flatUids.filter((uid): uid is number => typeof uid === 'number'))]
    const recentUids = allUids.slice(-5)

    logger.info({ toAddress, totalUids: allUids.length, fetching: recentUids.length }, 'IMAP: UIDs found')

    if (recentUids.length === 0) return []

    const buffers: Buffer[] = []
    for await (const msg of client.fetch(recentUids, { source: true })) {
      if (msg.source) buffers.push(msg.source)
    }

    logger.info({ toAddress, messagesFetched: buffers.length }, 'IMAP: messages fetched')

    return buffers
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

export const searchEmailsBySubjects = new SearchEmailsBySubjects()
