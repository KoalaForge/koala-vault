import type { Category, EmailSearchResult, ImapErrorReason } from '../types'
import { resolveImapConfig } from './ResolveImapConfig'
import { searchEmailsBySubjects } from './SearchEmailsBySubjects'
import { extractContentFromEmail } from './ExtractContentFromEmail'
import { logger } from '../logger'

function classifyImapError(err: unknown): ImapErrorReason {
  return (err as any)?.authenticationFailed === true ? 'auth_failed' : 'connection_error'
}

class ProcessEmailSearch {
  async execute(
    tenantId: string,
    emailAddress: string,
    category: Category,
    providerOverride?: string | null,
  ): Promise<EmailSearchResult> {
    const startTime = Date.now()

    const imapConfig = await resolveImapConfig.execute(tenantId, emailAddress, providerOverride)

    if (!imapConfig) {
      logger.warn(
        { emailAddress, tenantId },
        'IMAP: no config found — use /setimap for custom domains or /setprovider for known providers',
      )
      return {
        emailAddress,
        status: 'not_found',
        extractedContent: null,
        emailSubject: null,
        emailTime: null,
        fetchDurationMs: Date.now() - startTime,
      }
    }

    logger.info(
      { emailAddress, host: imapConfig.host, port: imapConfig.port, categoryId: category.id },
      'IMAP: config resolved, starting search',
    )

    try {
      const emails = await searchEmailsBySubjects.execute(imapConfig, category.subjectKeywords, emailAddress)

      logger.info({ emailAddress, emailsFound: emails.length, categoryId: category.id }, 'IMAP: search complete')

      const { content, emailDate, emailSubject } = extractContentFromEmail.execute(emails, category.extractionRegexList)

      logger.info({ emailAddress, contentFound: !!content, categoryId: category.id }, 'IMAP: extraction complete')

      return {
        emailAddress,
        status: content ? 'found' : 'not_found',
        extractedContent: content,
        emailSubject,
        emailTime: emailDate,
        fetchDurationMs: Date.now() - startTime,
      }
    } catch (err) {
      const errorReason = classifyImapError(err)
      logger.error({ err, emailAddress, tenantId, categoryId: category.id, errorReason }, 'IMAP: search failed')
      return {
        emailAddress,
        status: 'error',
        extractedContent: null,
        emailSubject: null,
        emailTime: null,
        fetchDurationMs: Date.now() - startTime,
        errorReason,
      }
    }
  }
}

export const processEmailSearch = new ProcessEmailSearch()
