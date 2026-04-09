
# RUET Student Intelligence Dashboard — Implementation Plan

## Design Direction
- **Palette**: Emerald Prestige — deep greens (#064e3b, #0d7a5f) with gold accents (#c9a84c) on warm cream (#f5f0e0)
- **Typography**: Inter for body, bold headings with gold accents for institutional feel
- **Layout**: Sidebar dashboard with collapsible navigation
- **Border radius**: 8px, generous whitespace, subtle shadows
- **Map**: SVG-based Bangladesh district choropleth (no API key needed)

## Architecture
- **Backend**: Lovable Cloud (Supabase) — database, auth, RLS, edge functions
- **Frontend**: React + Tailwind + ShadCN sidebar layout
- **Roles**: Admin and Student roles via `user_roles` table

---

## Phase 1: Data Pipeline

### Database Schema
- **`universities`** table — multi-university support from day one (id, name, code)
- **`students`** table — name (encrypted/hashed for privacy), merit_rank, admission_roll, application_id, department, university_id, district, verification_status (verified/unverified), verified_at, is_locked
- **`districts`** table — all 64 Bangladesh districts with codes
- **`user_roles`** table — admin/student roles with RLS

### PDF Parser (Edge Function)
- Edge function `parse-admission-pdf` that accepts PDF upload
- Extracts student records (Name, Merit, Admission Roll, Application ID, Department)
- Bulk inserts into `students` table
- Admin-only access

### Admin Dashboard
- Upload PDF page with drag-and-drop
- Preview parsed data before confirming import
- View all students in a searchable/filterable table
- Bulk update district assignments

---

## Phase 2: Student Verification Portal

### Student Login
- Students authenticate using **Admission Roll + Merit Rank** (no password needed — these act as credentials)
- Edge function validates the pair against the database
- Returns a session token (JWT) on match

### Verification Flow
- After login, student sees their own record (name, department, merit rank)
- Dropdown to select their home district (64 districts)
- Submit locks the record — one-time only, no edits after
- Data marked as "verified" with timestamp
- IP hash logged for anti-manipulation

### Security
- RLS policies: students can only read/update their own record
- Once `is_locked = true`, no further updates allowed (enforced via RLS)
- Names and admission rolls never exposed publicly

---

## Phase 3: Geo Analytics Engine

### SVG District Map
- Bangladesh SVG choropleth map component
- Each district colored by verified student count (gradient from light cream to deep emerald)
- Hover tooltips showing district name + count
- Click district to filter the data panel

### Filter Controls
- Department dropdown (CSE, EEE, ME, etc.)
- Merit range slider (e.g., top 100, top 500, all)
- Verification status toggle (verified only / all)

### Insights Panel (Sidebar cards)
- **Top Districts** — ranked list with bar chart
- **Department Distribution** — donut chart per department
- **"Where do the top 100 come from?"** — highlighted map view
- **Underrepresented Districts** — districts with 0-2 students flagged

### Public vs Admin Views
- **Public**: Aggregated map + insights only (no names, no rolls)
- **Admin**: Full data table + individual records + export
- **Student**: Own profile + public analytics

---

## Pages & Navigation (Sidebar)
1. **Dashboard Home** — key stats cards (total students, verified %, top department, top district)
2. **Map & Analytics** — choropleth + filters + insights panel
3. **Student Verification** — login + district selection (public-facing)
4. **Admin Panel** — PDF upload, student table, bulk actions (admin only)
5. **About** — disclaimer + platform info

---

## Key Components
- `AppSidebar` — collapsible sidebar with emerald theme
- `DistrictMap` — SVG Bangladesh choropleth
- `StatsCards` — summary metrics
- `StudentTable` — searchable/sortable admin table
- `VerificationForm` — student login + district selection
- `InsightsPanel` — charts and rankings
- `PdfUploader` — drag-and-drop PDF upload for admin

> **Phase 4 (Polling) and Phase 5-6 (Security hardening, multi-university)** will be built as follow-up iterations after these core phases are solid.
