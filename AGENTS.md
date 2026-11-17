<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Admin access = row in `public.user_roles` (role `admin`), granted only by `claim_admin()` for a verified email listed in `public.admin_allowlist`; never grant roles on signup or from client checks. Why: random signups must never become admin.
- All admin writes go through the browser client and are enforced by RLS + storage policies using `has_role()`; UI checks are cosmetic only. Why: security lives in the database.
- Public home data loads via the `getPublicSite` server function (publishable key, RLS) in the `/` loader. Why: SSR content for SEO without exposing admin access.
- Gallery images live in the private `gallery` storage bucket (public buckets are blocked by workspace policy) and are shown through signed URLs. Why: public read without a public bucket.
- Link/contract/image validation lives in `src/lib/site.ts` and mirrors the DB CHECK constraints; keep both in sync and covered by `src/lib/site.test.ts`.