import type { MiddlewareFn } from 'telegraf'
import type { BotContext, Tenant } from '../../types'
import { getSessionByUser } from '../../session/GetUserSession'

class InjectTenantContext {
  execute(tenant: Tenant): MiddlewareFn<BotContext> {
    return async (ctx, next) => {
      const userId = String(ctx.from?.id ?? '')
      const session = await getSessionByUser.execute(tenant.id, userId)

      ctx.tenantContext = { tenant, session }
      return next()
    }
  }
}

export const injectTenantContext = new InjectTenantContext()
