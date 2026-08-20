# Frontend

Client-side code for ServicePlus.

- `components/` — UI components (`ui/` = shadcn primitives, `layout/` = navbar & footer).
- `hooks/` — React hooks.
- `lib/` — browser-side helpers: money formatting, locale/RTL provider, auth session hook, `cn` util.

Routes stay in `src/routes/` because TanStack Router generates the route tree from that folder.
