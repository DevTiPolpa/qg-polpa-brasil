import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '../../../server/src/routers'

export const trpc = createTRPCReact<AppRouter>()

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        transformer: superjson,
        fetch: (url, opts) => fetch(url, { ...opts, credentials: 'include' }),
      }),
    ],
  })
}
