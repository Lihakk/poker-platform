# Public deployment checklist

Local implementation and test completion are not proof of internet availability. The planned provider remains Oracle Cloud Compute; no VM or domain has been connected in this workspace.

## Required external inputs

- VM SSH hostname or configured alias and username; use the user's existing SSH key locally, never send a private key or password in chat.
- Domain with DNS pointed at that VM, including removal/correction of stale AAAA records.
- Student/teacher approval of the topic and module -> quiz -> question hierarchy, and the student's title-page details.

## VM preparation

Install Docker Engine and the Compose plugin using the chosen OS's official instructions. Allow incoming TCP 80 and 443 in the Oracle network security rules and OS firewall; limit SSH to trusted addresses. Do not publish MariaDB 3306 or Go 8080 directly. Keep the VM patched.

Put the project on the VM, create its untracked `.env` from `.env.example`, and set `SITE_ADDRESS`, independent strong database passwords and a random JWT secret of at least 32 characters. Use DSN-safe passwords or correctly encode the database DSN. Do not commit `.env`, tokens or private keys. Run `docker compose config --quiet` and then `docker compose up -d --build`.

Register the intended administrator, then temporarily set `ADMIN_EMAIL` for the API container and restart it to grant the role. Clear the bootstrap variable after verifying the account. Caddy provisions HTTPS for the configured domain when DNS and firewall rules are correct.

## Acceptance evidence

- Frontend opens through the public HTTPS domain, including direct navigation to a nested route.
- `/api/health` returns 200; verify actual database-backed content as health is process liveness only.
- Registration/login work, refresh cookie has HttpOnly/SameSite/Secure, refresh and logout work.
- Demonstrate CRUD and ownership with dedicated demonstration accounts; never run destructive demo collections against real user content.
- Confirm only 80/443 and restricted SSH are publicly reachable.
- Capture the URL, date, deployment screenshot, backup/restore plan and a fresh production Lighthouse report.
- Update the diagram/report with actual deployment details, commit reviewed changes and submit the report to GitHub or Moodle.

Until those checks are performed, public hosting and submission remain unverified requirements.
