import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Request, Response } from 'express'
import { authenticateRequest } from './auth'

export interface Context {
  req: Request
  res: Response
  user: Awaited<ReturnType<typeof authenticateRequest>>
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<Context> {
  const user = await authenticateRequest(req)
  return { req, res, user }
}

const t = initTRPC.context<Context>().create({ transformer: superjson })

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.user } })
})
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  if (ctx.user.role !== 'ADMIN') throw new TRPCError({ code: 'FORBIDDEN' })
  return next({ ctx: { ...ctx, user: ctx.user } })
})
