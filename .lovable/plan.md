# Plan: Revamp Verification Flow & Secure Admin Panel

## Summary

Restructure the app so the **heatmap is the main experience**. Add a persistent "Add Your District" button in the top-right header that opens a modal with the full verification flow (Google/phone OAuth first, then name search, department + merit as confirmation, district selection). Remove the dedicated `/verify` page route. Hide admin panel from sidebar and protect it with a password gate. Fix the build error in the edge function.

## What Changes

### 1. Fix build error (edge function)

- In `supabase/functions/parse-admission-pdf/index.ts` line 48, cast `error` as `Error` to fix `TS18046: 'error' is of type 'unknown'`.

### 2. Make Map/Analytics the home page

- Change the `/` route to render `MapAnalytics` instead of `DashboardHome`
- Keep `DashboardHome` as a secondary stats page at `/dashboard`

### 3. "Add Your District" button in header

- Add a button in `DashboardLayout` header (top-right) that opens a Dialog/modal
- The modal contains the full verification flow (refactored `VerificationForm` to work inside a modal)
- Flow: Google OAuth or Phone OTP → search name → select department + enter merit rank (department and merit acts as password) → select district → submit & lock

### 4. Refactor VerificationForm for modal use

- Remove the dedicated `/verify` route from `App.tsx`
- Remove "Verification" from sidebar navigation
- Adapt the form to work inside a `Dialog` component
- Remove sign-out button entirely (no sign out for general users)
- Remove the "Registration guardrails" alert about IP (don't tell users about IP restrictions)
- Keep IP-based restriction in the edge function but show generic error on block

### 5. IP-based auto-login across browser windows

- On app load, check if user already has a Supabase session (already done via `getSession`)
- If session exists, the "Add Your District" button shows their verified status instead
- Since Supabase persists sessions in localStorage, same-browser windows auto-share the session

### 6. Configure Google OAuth

- Use Lovable Cloud managed Google OAuth via `lovable.auth.signInWithOAuth("google")`
- Configure social auth tool to generate the lovable module

### 7. Secure Admin Panel

- Remove "Admin Panel" and "Management" section from `AppSidebar`
- Admin panel stays at `/admin` but is not linked in the UI
- Add a password gate component: on visiting `/admin`, user must enter a hardcoded admin password before seeing the panel
- Store password-verified state in sessionStorage so it persists during the tab session

### 8. Sidebar cleanup

- Remove "Verification" nav item
- Remove "Admin Panel" / "Management" section
- Keep: Dashboard, Map & Analytics, About

## Technical Details

**Files to modify:**

- `supabase/functions/parse-admission-pdf/index.ts` — fix error type
- `src/App.tsx` — remove `/verify` route, swap home route to MapAnalytics
- `src/layouts/DashboardLayout.tsx` — add "Add Your District" button in header, verification modal
- `src/components/AppSidebar.tsx` — remove Verification and Admin items
- `src/components/VerificationForm.tsx` — refactor for modal, remove sign-out, remove IP warning
- `src/components/VerificationModal.tsx` — new wrapper component with Dialog
- `src/components/AdminGate.tsx` — new password gate component
- `src/pages/AdminPanel.tsx` — wrap with AdminGate
- `src/pages/StudentVerification.tsx` — delete (no longer needed)

**Database:** No schema changes needed. The `student_verifications` table and `submit-verification` edge function already handle IP hashing and one-per-user limits.

**Auth:** Configure Lovable Cloud managed Google OAuth. Phone OTP uses existing Supabase auth.