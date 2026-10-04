# GitHub Copilot Build Guide — Embroidery Supplies Manager

How to build the capstone step by step with Copilot. The architecture, schema and rules live in `.github/copilot-instructions.md` — Copilot reads that file automatically, so your prompts can stay short.

## 1. Setup checklist

1. Create a **public GitHub repo** and clone it.
2. Put `.github/copilot-instructions.md` in the repo and make the **first commit** with it.
3. In VS Code, open Copilot Chat in **Agent mode** and check that custom instructions are enabled (Settings → search "copilot instructions").
4. Create a Supabase project; install the Supabase CLI (`npx supabase` works too).
5. Work in the loop: **prompt → implement → run & test → refine → commit & push** (or discard).

## 2. Assessment checklist

| Criterion | What you need |
|---|---|
| Commits (15) / days (15) | 15+ commits across at least 3 different days — commit after every working step |
| Architecture (10) | Vite, multi-page, modular `services` / `pages` / `components` |
| Screens (10) | 5+ responsive screens (this plan has 9) |
| Database (12) | 4+ tables (this plan has 6) |
| Admin panel (10) | `user_roles` + admin page |
| File storage (10) | Photo upload/download for supplies and projects |
| Deployment (8) | Live on Netlify/Vercel + sample credentials |
| Auth & security (5) | RLS on every table, enforced server-side |
| Documentation (5) | README + architecture + DB schema diagram |

## 3. Build plan (commit after each step)

Suggested spread: **Day 1** steps 1–4, **Day 2** steps 5–8, **Day 3** steps 9–12.

### Step 1 — Project scaffold
> Set up a Vite vanilla JS multi-page project following the folder structure in the instructions. Install bootstrap and bootstrap-icons. Create `index.html`, a shared navbar component, `main.css`, and a `vite.config.js` that lists all pages under `build.rollupOptions.input`. Add `.env.example`.

Commit: `chore: scaffold Vite multi-page project with Bootstrap`

### Step 2 — Database schema and migrations
> Initialize Supabase in this repo. Create migrations for `profiles`, `user_roles`, `categories`, `supplies`, `projects` and `project_items` as described in the instructions, with foreign keys and indexes. Add a trigger that creates a profile and a `user` role row on signup. Do not add RLS yet.

Commit: `feat(db): add initial schema migration` · run `supabase db push`

### Step 3 — Row-Level Security
> Create a new migration that enables RLS on all tables, adds the `is_admin()` helper, and writes owner policies for supplies/projects, parent-ownership policies for project_items, read-for-all/write-for-admin on categories, and safe policies for user_roles. Explain each policy briefly.

Commit: `feat(db): enable RLS policies` · test with two users to confirm isolation

### Step 4 — Authentication
> Create `supabaseClient.js`, `authService.js`, register and login pages, logout in the navbar, and `guards.js` with `requireAuth` and `requireAdmin`. Navbar should show different links for guests, users, and admins.

Commit: `feat(auth): register, login, logout and route guards`

### Step 5 — Categories seed + supplies list
> Add a migration seeding the default categories. Build `suppliesService.js` and `supplies.html` that lists the current user's supplies as Bootstrap cards with category badge, color swatch, quantity, search box, category filter and sort. Include loading and empty states.

Commit: `feat(supplies): browse supplies with search and filters`

### Step 6 — Add / edit / delete supplies
> Build `supply-form.html` for creating and editing a supply (same page, edit via `?id=`). Validate input, show toasts, and add delete with a confirmation modal.

Commit: `feat(supplies): create, edit and delete supplies`

### Step 7 — Photo upload
> Create the `supply-photos` bucket and storage policies in a migration. Add `storageService.js` (upload, delete, getUrl) with type/size validation, and use it in the supply form and cards. Delete old files on replace/delete.

Commit: `feat(storage): supply photo upload and display`

### Step 8 — Projects CRUD
> Build `projectsService.js`, `projects.html` (cards with status badges and cover photo) and `project-form.html` (create/edit with cover image upload via the `project-files` bucket).

Commit: `feat(projects): manage projects with cover images`

### Step 9 — Project supply list (core feature)
> Build `project-detail.html`. Show project info and its needed items. Let the user add an item either by picking one of their owned supplies or by entering a new one (not owned). Show each item as owned / partial / missing with quantities, a progress bar for overall completeness, and a shopping-list section for missing items. Add a button "Mark as purchased" that creates a supply and links the item.

Commit: `feat(projects): track needed vs owned supplies`

### Step 10 — Profile page and dashboard
> Build `profile.html` (display name, avatar upload) and make `index.html` a dashboard with counts (supplies, projects, items to buy) and recent projects.

Commit: `feat: profile page and dashboard`

### Step 11 — Admin panel
> Build `admin.html` guarded by `requireAdmin`. Tabs for: categories (CRUD), users (list with role and a role-change control), and overall stats. Make sure the server-side RLS actually enforces admin-only actions.

Commit: `feat(admin): admin panel for categories and users`

### Step 12 — Polish, docs and deployment
> Review all pages for responsiveness and missing loading/empty/error states. Then generate `README.md`, `docs/architecture.md`, and `docs/database.md` with a Mermaid ER diagram, based on the actual code and migrations.

Then deploy (Netlify/Vercel), add env vars, create demo accounts (user + admin), and add the URL and credentials to the README.

Commit: `docs: add README, architecture and database docs` · `chore: deployment config`

## 4. Prompting tips

- **One feature per prompt.** Big prompts produce big, hard-to-review diffs.
- **Point at context:** use `#file:` / `#folder:` references or `@workspace` so Copilot follows existing patterns.
- **Ask for a plan first** on risky tasks: "Before coding, list the files you'll change and why."
- **Review every diff.** Check that nothing bypasses services, no secrets appear, and RLS is respected.
- **Test with two accounts** after any security change: user A must not see user B's data; a normal user must not reach admin features.
- **Debug with evidence:** paste the exact error, the file, and what you expected.
- **Update the instructions file** when a decision changes — it's the memory the agent relies on.
- **Discard bad output.** Revert and re-prompt with a clearer, smaller ask rather than patching a messy result.

## 5. Handy prompts

**Code review**
> Review `#file:src/services/projectsService.js` against the rules in the instructions. Point out security, error-handling and naming problems.

**Security audit**
> List every table and storage bucket and confirm RLS/policies exist. Identify any way a normal user could read or modify another user's data or become admin.

**Responsive check**
> Review `pages/supplies.html` and its CSS for mobile layout problems at 375px width and propose minimal fixes.

**Commit message**
> Summarize the staged changes as one conventional commit message.

## 6. Definition of done for each step

- [ ] Works locally with `npm run dev`
- [ ] No console errors; loading, empty and error states exist
- [ ] New schema changes are in `supabase/migrations/`
- [ ] RLS/storage policies cover any new table or bucket
- [ ] Committed and pushed with a clear message
