import { trpc } from '../lib/trpc';
export function useAuth(redirectIfUnauthenticated = false) {
    const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });
    const logoutMutation = trpc.auth.logout.useMutation({
        onSuccess: () => { window.location.href = '/login'; },
    });
    const isAuthenticated = !!user && !isLoading;
    const isAdmin = user?.role === 'ADMIN';
    return { user, isLoading, isAuthenticated, isAdmin, logout: logoutMutation.mutate };
}
