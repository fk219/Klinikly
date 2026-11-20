# Admin contexts

State shared across the hospital admin portal.

## Files

- `auth-context.ts` — creates the auth context and defines its public type.
- `AuthProvider.tsx` — owns login/logout, restores the stored admin session, and provides auth state.
- `useAuth.ts` — typed hook for reading the auth context; throws outside the provider.
