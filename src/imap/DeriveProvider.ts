import type { ImapProvider } from '../types'

const PROVIDER_DOMAIN_MAP: Record<string, ImapProvider> = {
  'gmail.com': 'gmail',
}

class DeriveProvider {
  execute(emailAddress: string): ImapProvider | null {
    const domain = emailAddress.split('@')[1]?.toLowerCase() ?? ''
    return PROVIDER_DOMAIN_MAP[domain] ?? null
  }
}

export const deriveProvider = new DeriveProvider()
