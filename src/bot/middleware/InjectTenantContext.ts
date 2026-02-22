import type { MiddlewareFn } from 'telegraf'
import type { BotContext, Tenant } from '../../types'
import { getSessionByUser } from '../../session/GetUserSession'
import { findTenantById } from '../../tenant/FindTenantById'

class InjectTenantContext {
  execute(tenant: Tenant): MiddlewareFn<BotContext> {
    return async (ctx, next) => {
      const userId = String(ctx.from?.id ?? '')
      const freshTenant = await findTenantById.execute(tenant.id) ?? tenant
      const session = await getSessionByUser.execute(freshTenant.id, userId)

      ctx.tenantContext = { tenant: freshTenant, session }
      return next()
    }
  }
}

export const injectTenantContext = new InjectTenantContext()
