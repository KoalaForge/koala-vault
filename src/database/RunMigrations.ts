import { connectDatabase } from './connection'
import { TenantModel } from './models/TenantModel'
import { ImapProviderDefaultModel } from './models/ImapProviderDefaultModel'
import { ImapAddressOverrideModel } from './models/ImapAddressOverrideModel'
import { CategoryModel } from './models/CategoryModel'
import { WhitelistModel } from './models/WhitelistModel'
import { SessionModel } from './models/SessionModel'
import { AccessRequestModel } from './models/AccessRequestModel'
import { RegisteredEmailModel } from './models/RegisteredEmailModel'
import { EmailAssignmentModel } from './models/EmailAssignmentModel'

class EnsureIndexes {
  async execute(): Promise<void> {
    await connectDatabase.execute()

    await Promise.all([
      TenantModel.ensureIndexes(),
      ImapProviderDefaultModel.ensureIndexes(),
      ImapAddressOverrideModel.ensureIndexes(),
      CategoryModel.ensureIndexes(),
      WhitelistModel.ensureIndexes(),
      SessionModel.ensureIndexes(),
      AccessRequestModel.ensureIndexes(),
      RegisteredEmailModel.ensureIndexes(),
      EmailAssignmentModel.ensureIndexes(),
    ])

    console.log('✅ MongoDB indexes ensured')
    process.exit(0)
  }
}

new EnsureIndexes().execute().catch((err) => {
  console.error('❌ Index setup failed:', err)
  process.exit(1)
})
