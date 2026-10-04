# Embroidery Supplies Manager

A planned multi-page app for embroidery hobbyists to track supplies, organize projects, and see which materials they still need.

## Project status

The initial Vite scaffold is in place, including the home page, responsive shared navbar, Bootstrap styling, and multi-page build configuration. Feature pages, Supabase integration, and database migrations are planned but have not been implemented yet.

## Documentation

- [Implementation plan](docs/implementation-plan.md)
- [Build guide](docs/copilot-guide.md)
- [Project instructions](docs/copilot-instructions.md)

## Planned technology

Vanilla JavaScript ES modules, HTML, CSS, Bootstrap 5, Vite, and Supabase (Postgres, Auth, and Storage).

See the [implementation plan](docs/implementation-plan.md) for the planned build phases and verification steps.

## Local development

```sh
npm install
npm run dev
```

To build the production bundle, run `npm run build`. Copy `.env.example` to `.env` and fill in the Supabase values when backend integration is added.
