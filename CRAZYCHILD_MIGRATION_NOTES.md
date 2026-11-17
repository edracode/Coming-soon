# CraZyChilD original source backup

Original Lovable project: https://lovable.dev/projects/7e9f6d3b-0a18-4e54-88eb-f20bd9598c6d

This isolated Git branch contains all **119 readable text source files** from the Lovable project, including React/TypeScript frontend, RLS SQL, Supabase client, admin, tests and build configuration.

**Excluded from Git backup**: `.env` and five binary images not exported in raw byte form: `public/apple-touch-icon.png`, `public/favicon.png`, `src/assets/hero-crazychild.jpg`, `src/assets/logo-crazychild-256.png`, `src/assets/logo-crazychild.png`.

The missing binary images MUST be restored or their imports replaced before building the React app. The live Supabase database, auth users and storage objects are not included in the code backup. Migration to external hosting must set new auth URL redirect allowlists, env vars and compatible SSR build platform.

For a functional **static adaptation including both music MP3 files**, use `CraZyChilD-Website-Musik-Migrasi.zip` shared in the ChatGPT conversation. That package uses the existing backend and includes a standalone audio player and admin controls. Hosting deployment is still required. The music-inclusive package is NOT the original Lovable source.

Do not overwrite `main`; this branch is reserved for CraZyChilD source only.
