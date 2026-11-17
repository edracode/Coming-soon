# CraZyChilD — first owner/admin setup

1. Open the site and go to `/auth` (or click "Owner login" in the footer).
2. Choose "First time? Create the owner account", sign up with your email and a strong password.
3. Click the confirmation link in the email you receive.
4. Approve your email as admin (one time). Either:
   - ask Lovable in chat: "Add my-email@example.com to the admin allowlist", or
   - open Cloud → Database → `admin_allowlist` table and add a row with your email in lowercase.
5. Sign in at `/auth`, you'll land on `/admin`. Press "Activate admin access".
6. Done. From the Admins tab you can approve co-admins; removing an email revokes access immediately.

Signing up alone never grants admin rights.