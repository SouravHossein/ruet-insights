

The user picked Option B (migrate to external Supabase + Facebook OAuth). But there's also an immediate build error blocking everything: missing testing-library exports in two test files. I need to address both.

Scope check on Option B: a true "migrate to external Supabase" means disconnecting Lovable Cloud, which is irreversible per platform rules. I should flag that clearly and offer the realistic alternative: keep Lovable Cloud (don't lose existing data, auth, edge functions, students/verifications tables) and just **add a Facebook profile field manually** + social directory, since Facebook OAuth itself is not supported on Lovable Cloud.

Also fix the build errors regardless — they block everything.

Keep concise.

# Plan: Fix Build + Decide Auth Path for Facebook

## Part 1 — Fix build errors (do first, no decisions needed)

Two test files import `screen`, `waitFor`, `fireEvent` from `@testing-library/react`, but the installed version doesn't re-export them (likely only `render` is available, or the package isn't installed correctly).

**Fix:** install `@testing-library/dom` (which provides `screen`, `waitFor`, `fireEvent`) as a devDependency. `@testing-library/react` re-exports from it when present. Alternatively import directly from `@testing-library/dom` in those two test files.

Files touched:
- `package.json` — add `@testing-library/dom` devDep
- (no test file changes needed once dom package is present)

## Part 2 — Important reality check on "migrate to external Supabase"

I have to flag this before doing it:

1. **Lovable Cloud cannot be "migrated away from" cleanly.** Once Cloud is enabled on a project, disabling it is not supported on this project — it only affects future projects. Your existing students, verifications, edge functions, and auth users live in the Lovable-managed Supabase project and would not transfer.
2. **Facebook OAuth genuinely is not supported by Lovable Cloud's managed auth.** That part of your request is a real platform limitation.
3. **A true migration would mean:** standing up your own Supabase project, recreating schema + RLS + edge functions + data, swapping `src/integrations/supabase/client.ts` to point at the new project, and rebuilding the auth flow. This is a large, risky rebuild and you lose the Lovable Cloud convenience layer.

Because of this, I recommend a **pragmatic hybrid** that gets you the user-visible outcome (Facebook profiles + friend/message actions on the directory) without a destructive migration:

```text
Pragmatic Option B':
- Keep Lovable Cloud + existing Google/phone auth
- After verification, ask the student for their Facebook profile URL/username
- Store it on a new `student_social_profiles` table
- Verified students can browse other verified students' profiles
- "Add Friend" -> opens facebook.com/<handle>
- "Message"    -> opens m.me/<handle>
- App-managed friend requests table for in-app status
```

This delivers everything visible the user asked for, except the literal "log in with Facebook" button. Given Facebook OAuth is platform-blocked on Lovable Cloud, I cannot deliver the literal button without the destructive migration above.

## Part 3 — If you still want the literal Facebook login button

Then the only path is to **stop using Lovable Cloud on a new project** and connect an external Supabase project there, then port this codebase. I won't do that inside the current project because it would break your live data.

## Decision needed

Pick one before I implement:

1. **Recommended:** Fix build errors + implement Pragmatic Option B' (FB profile field + verified directory + friend requests + deep links to facebook.com / m.me) on current Lovable Cloud.
2. **Build fix only:** Just fix the failing tests now, defer all social/Facebook work.
3. **Hard migration:** You start a new project, connect your own Supabase, and we replan there. (I can't do this destructively in this project.)

