import { createCipheriv, randomBytes } from 'crypto'
import { config } from '../config/env'

class Encrypt {
  execute(plaintext: string): string {
    const key = Buffer.from(config.imapEncryptionKey, 'hex')
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key, iv)

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    return Buffer.concat([iv, authTag, encrypted]).toString('base64')
  }
}

export const encrypt = new Encrypt()
