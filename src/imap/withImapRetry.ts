import { logger } from '../logger'

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 500

/**
 * Retries an IMAP operation up to MAX_ATTEMPTS times with linear backoff.
 * Delays: 500ms, 1000ms between retries.
 * Throws the last error if all attempts fail.
 */
export async function withImapRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err

      if (attempt < MAX_ATTEMPTS) {
        const delayMs = BASE_DELAY_MS * attempt
        logger.warn(
          { err, attempt, maxAttempts: MAX_ATTEMPTS, delayMs, label },
          'IMAP: transient error, retrying',
        )
        await new Promise(res => setTimeout(res, delayMs))
      }
    }
  }

  throw lastErr
}
