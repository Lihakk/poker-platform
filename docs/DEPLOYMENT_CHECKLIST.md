# Oracle Cloud deployment

- [Public PokerLearn site](https://pokerlearn.144-24-247-126.sslip.io:5000)
- [API health check](https://pokerlearn.144-24-247-126.sslip.io:5000/api/health)
- [Deployment diagram](deployment-diagram.svg)

## Architecture

Docker Compose runs Caddy, the Go API and MariaDB on an ARM64 Oracle Cloud Compute VM. DNS resolves the public hostname to the VM. Port `80` is used for certificate validation and redirects visitors to HTTPS on port `5000`. Docker maps the VM's `5000` to Caddy's `443`. Caddy serves the React build and proxies `/api/*` to Go on the same origin. The API and database do not publish their ports to the VM. Named volumes persist MariaDB data and Caddy certificates.

## Reproduce the deployment

1. Install Docker Engine and Docker Compose with support for `!override` (Compose 2.24.4 or newer). Point a hostname to the VM. Open TCP `80` and `5000` in the VM firewall and Oracle network rules. Restrict SSH access and leave `8080` and `3306` unpublished.
2. Create an untracked `.env` from [`.env.example`](../.env.example). Set `SITE_ADDRESS` to the hostname without a scheme or port. Generate separate strong database passwords and a random JWT secret of at least 32 characters. Use a DSN-safe password for `DB_PASSWORD`. Never commit `.env`, keys or tokens.
3. From the directory containing the Compose files, validate and build:

   ```sh
   docker compose -p pokerlearn -f compose.yaml -f compose.oracle.yaml config --quiet
   docker compose -p pokerlearn -f compose.yaml -f compose.oracle.yaml up -d --build
   ```

   This builds from source. The running VM was deployed with prebuilt React assets and a Linux ARM64 Go binary to save VM disk space, using the same services and port mappings. To use standard HTTPS on `443` with a different firewall setup, use the base `compose.yaml` alone.
4. Register the administrator, then temporarily set `ADMIN_EMAIL` and recreate the API service to grant the role. Verify access, remove the setting and recreate the API service again. Never use a real user's account for demo writes.

## Verified on the public deployment

- HTTP redirects to the HTTPS port. The site and direct navigation to a nested page work over HTTPS.
- `/api/health` responds successfully. Database-backed lists, pagination and nested resources were verified separately because health only checks process liveness.
- Registration and login work. The refresh cookie is `Secure`, `HttpOnly` and `SameSite=Lax`. Refresh rotates the cookie. Logout returns `204` and a subsequent request with the revoked access JWT returns `401`.
- A learner can read protected data but receives `403` on create. An editor can create content (`201`) but receives `403` when editing another editor's module. An administrator can edit that module (`200`). See the [demo guide](DEMONSTRAVIMAS_LT.md) for reproduction steps.

Before handing the service over, record a fresh production Lighthouse run and verify a database backup and restore. The repository includes the report. Its title page and any required course submission remain separate from the cloud deployment.
