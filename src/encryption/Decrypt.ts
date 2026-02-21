import { createDecipheriv } from 'crypto'
import { config } from '../config/env'

class Decrypt {
  execute(encryptedBase64: string): string {
    const key = Buffer.from(config.imapEncryptionKey, 'hex')
    const buffer = Buffer.from(encryptedBase64, 'base64')

    const iv = buffer.subarray(0, 12)
    const authTag = buffer.subarray(12, 28)
    const encrypted = buffer.subarray(28)

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8')
  }
}

export const decrypt = new Decrypt()
