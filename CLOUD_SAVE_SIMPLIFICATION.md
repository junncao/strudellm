# Cloud Save Simplification Plan

## Overview

Remove Jazz integration and simplify the app to a single-REPL model with a "cloud save coming soon" waitlist flow.

## Current State

- **Jazz** provides real-time sync for authenticated users
- **Better Auth + Jazz plugins** handle authentication with Jazz credential sync
- **Multiple REPLs** stored per user with tab UI
- **Sign-out bug**: Jazz plugin causes `"[object Object]" is not valid JSON` error

## Target State

- **No Jazz** - remove entirely
- **Better Auth only** - magic link sign-in to capture email for waitlist
- **Single REPL** - one code editor, localStorage only
- **Coming soon messaging** - transparent about cloud save being in development

---

## Implementation Plan

### Phase 1: Remove Jazz from Auth

#### 1.1 `src/lib/auth-client.ts`

**Remove:**
- `jazzPluginClient()` from plugins array
- `magicLinkJazzPlugin` fetch plugin (lines 14-43)
- `jazz-tools/better-auth/auth/client` import

**Keep:**
- `createAuthClient` with `magicLinkClient()` only
- `signIn`, `signOut`, `useSession` exports

#### 1.2 `src/lib/auth.ts`

**Remove:**
- `jazzPlugin()` from plugins array
- `ensureJazzColumns()` function and call
- `jazz-tools/better-auth/auth/server` import

**Keep:**
- Better Auth setup with magic link
- Resend email sending
- Database config (Postgres/SQLite)

#### 1.3 `src/lib/providers.tsx`

**Replace entire file with:**
```tsx
"use client";

import { PropsWithChildren } from "react";

export function JazzAndAuthProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
```

#### 1.4 `src/app/auth/verify/page.tsx`

**Remove:**
- Jazz credential handling (`jazz-logged-in-secret` localStorage)
- `x-jazz-auth` header logic

**Keep:**
- Magic link token verification via Better Auth
- Redirect to callback URL

#### 1.5 `src/lib/jazz-schema.ts`

**Delete entire file.**

---

### Phase 2: Simplify Storage to Single REPL

#### 2.1 `src/hooks/use-strudel-storage.ts`

**Replace with simplified version:**

```tsx
"use client";

import { useCallback, useMemo, useState, useEffect } from "react";

const STORAGE_KEY = "strudel-code";
const DEFAULT_CODE = `// Welcome to Strudel!
// Try: sound("bd sd")`;

export interface SimpleStrudelStorage {
  code: string;
  setCode: (code: string) => void;
  resetCode: () => void;
  isLoaded: boolean;
}

export function useStrudelStorage(): SimpleStrudelStorage {
  const [code, setCodeState] = useState(DEFAULT_CODE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCodeState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setCode = useCallback((newCode: string) => {
    setCodeState(newCode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newCode);
    }
  }, []);

  const resetCode = useCallback(() => {
    setCodeState(DEFAULT_CODE);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, DEFAULT_CODE);
    }
  }, []);

  return useMemo(() => ({
    code,
    setCode,
    resetCode,
    isLoaded,
  }), [code, setCode, resetCode, isLoaded]);
}
```

#### 2.2 Remove Tab UI

**Files to modify:**
- `src/strudel/components/repl-tabs.tsx` - Delete or hide
- Any component rendering tabs - Remove tab references

#### 2.3 `src/components/strudel-storage-sync.tsx`

**Simplify** to just sync single REPL code with the editor.

---

### Phase 3: Update Auth UI with Coming Soon Messaging

#### 3.1 `src/components/auth/auth-modal.tsx`

**Update copy:**
- Title: "Get notified when cloud save launches"
- Subtitle: "We're building cloud sync so your code is saved across devices. Sign up to be the first to know when it's ready."
- Button: "Notify me"

#### 3.2 `src/components/auth/auth-button.tsx`

**Before sign-in:**
- Show: "Cloud save coming soon" link/button

**After sign-in:**
- Show: User email + "We'll notify you when cloud save is ready"
- Remove sign-out button (or keep minimal)

#### 3.3 Post-Sign-In Notification

After successful magic link verification, show toast/banner:
> "Thanks for signing up! We'll email you when cloud save is ready."

---

### Phase 4: Cleanup

#### 4.1 Remove Jazz dependency

```bash
npm uninstall jazz-tools
```

#### 4.2 Remove environment variable

Delete from `.env` / `.env.local`:
```
NEXT_PUBLIC_JAZZ_API_KEY=...
```

#### 4.3 Update components that reference old storage

Search for and update any references to:
- `useAccount`
- `useIsAuthenticated` (from jazz-tools)
- `StrudelAccount`
- `StrudelRepl`
- `allRepls`
- `getReplForThread`
- Tab-related storage functions

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/jazz-schema.ts` | Delete |
| `src/lib/auth-client.ts` | Remove Jazz plugins |
| `src/lib/auth.ts` | Remove Jazz plugin |
| `src/lib/providers.tsx` | Simplify to passthrough |
| `src/app/auth/verify/page.tsx` | Remove Jazz credential handling |
| `src/hooks/use-strudel-storage.ts` | Rewrite for single REPL |
| `src/components/strudel-storage-sync.tsx` | Simplify |
| `src/strudel/components/repl-tabs.tsx` | Remove/hide |
| `src/components/auth/auth-modal.tsx` | Update copy |
| `src/components/auth/auth-button.tsx` | Update copy + post-signin state |
| `src/app/chat/page.tsx` | Remove Jazz auth checks |
| `package.json` | Remove jazz-tools |

---

## Testing Plan

### Pre-Implementation: Document Current Behavior

Before making changes, verify current broken behavior:
- [ ] Sign-out returns 500 error with JSON parse error

### Phase 1 Tests: Auth Without Jazz

#### 1.1 Sign-In Flow
- [ ] Click sign-in button → modal opens
- [ ] Enter email → magic link sent (check console in dev)
- [ ] Click magic link → redirects to app
- [ ] Session is established (no errors)

#### 1.2 Sign-Out Flow (The Bug Fix)
- [ ] Click sign-out → succeeds without 500 error
- [ ] Session is cleared
- [ ] UI returns to signed-out state

#### 1.3 Page Refresh
- [ ] Refresh page while signed in → session persists
- [ ] Refresh page while signed out → stays signed out

### Phase 2 Tests: Single REPL Storage

#### 2.1 Code Persistence
- [ ] Type code in editor
- [ ] Refresh page → code is still there
- [ ] Close browser, reopen → code is still there

#### 2.2 Reset Functionality
- [ ] Click reset → code returns to default
- [ ] Refresh page → default code persists

#### 2.3 No Tab UI
- [ ] Verify no tab bar is visible
- [ ] Verify no "new tab" or "switch tab" functionality

### Phase 3 Tests: Coming Soon Messaging

#### 3.1 Pre-Sign-In State
- [ ] "Cloud save coming soon" messaging is visible
- [ ] Sign-up CTA is clear about what user is signing up for

#### 3.2 Sign-In Modal
- [ ] Modal clearly states this is for notifications
- [ ] Copy mentions cloud save is "coming soon"

#### 3.3 Post-Sign-In State
- [ ] After sign-in, see confirmation message
- [ ] Message indicates user will be emailed when feature launches
- [ ] User email is displayed

### Phase 4 Tests: Cleanup Verification

#### 4.1 No Jazz References
- [ ] `npm ls jazz-tools` returns empty/not found
- [ ] No console errors mentioning Jazz
- [ ] No network requests to `cloud.jazz.tools`

#### 4.2 Build Verification
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] No TypeScript errors

### Edge Cases

#### Storage Edge Cases
- [ ] localStorage disabled → app still works (graceful degradation)
- [ ] localStorage full → handles error gracefully

#### Auth Edge Cases
- [ ] Expired magic link → shows appropriate error
- [ ] Invalid magic link → shows appropriate error
- [ ] Multiple sign-in attempts → no duplicate emails sent rapidly

### Browser Testing

- [ ] Chrome - all tests pass
- [ ] Firefox - all tests pass
- [ ] Safari - all tests pass
- [ ] Mobile Safari - all tests pass
- [ ] Mobile Chrome - all tests pass

---

## Rollback Plan

If issues arise:
1. Revert commits
2. Restore `jazz-tools` dependency
3. Restore deleted files from git history

---

## Future: When Cloud Save Ships

When ready to implement actual cloud save:
1. Add database tables for REPLs (see earlier plan)
2. Create API routes for CRUD
3. Update `useStrudelStorage` to call APIs for authenticated users
4. Email waitlist users via Resend segment
5. Update UI to remove "coming soon" messaging
