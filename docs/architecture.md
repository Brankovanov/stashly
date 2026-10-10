# Architecture overview

## High-level structure

The app uses a static multi-page frontend built with Vite and vanilla JavaScript. Pages handle DOM rendering and user interactions, while Supabase service modules contain all data access logic.

## Layers

### Frontend

- `index.html` and the pages under `pages/` are the user-facing screens.
- `src/pages/` contains page entry scripts with events, validation, and rendering.
- `src/components/` provides reusable UI pieces such as navigation, confirm modals, and toast messages.
- `src/utils/` keeps guards, formatting helpers, and shared validation logic.

### Data access

- `src/lib/supabaseClient.js` is the single place where `createClient()` is created.
- `src/services/` contains all Supabase calls, such as auth, supplies, projects, admin, and storage access.
- Services return data or throw user-friendly errors rather than touching the DOM.

### Database and auth

- Supabase Postgres stores app data.
- Auth uses Supabase Auth for sign up, sign in, and session tracking.
- Row-level security ensures each user can only reach their own data unless they are an admin.
- `src/lib/supabaseClient.js` creates the single Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/services/authService.js` wraps auth operations and role lookup; `src/utils/guards.js` exposes authenticated-user and admin guards.
- `src/services/suppliesService.js` loads the current RLS-visible inventory and categories for the supplies listing page.

## Request flow

1. The user opens a page.
2. The page script calls a service function.
3. The service reads or writes data through the Supabase client.
4. RLS policies enforce ownership and admin rules in the database.
5. The page renders the result and shows loading, empty, or error states.

## Security model

- Client-side guards and UI hiding are only UX conveniences.
- Database RLS remains the source of truth for access control.
- Admin actions are restricted server-side via `public.is_admin()`.
