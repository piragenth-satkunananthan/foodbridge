# Local HTTP testing

From the repository root, with Docker running:

```bash
docker compose -f docker-compose.local.yml up -d --build --wait
```

Open **http://localhost:8080**. Use HTTP, not HTTPS. The frontend's Nginx
server proxies `/api` to the backend; Caddy and certificates are not used.
This is a standalone Compose file, not an override for `docker-compose.yml`.

The stack uses the `foodbridge-local` project, a separate MongoDB volume,
and a local-only JWT secret. No `.env` file is required. Only the frontend
is exposed, bound to the local machine; MongoDB and the API stay on the
Compose network. Production configuration is unchanged.

The database starts empty. Register an account to test the app. The shared
demo login buttons require seed data and will not work on an empty database.
Seeding is not part of startup.

To use another HTTP port:

```bash
FOODBRIDGE_LOCAL_PORT=8081 docker compose -f docker-compose.local.yml up -d --build --wait
```

Use the same port setting for subsequent Compose commands. Frontend changes
require rebuilding; this stack tests the built app rather than a hot-reload server.

```bash
# Check the proxied API and container logs
curl http://localhost:8080/api/health
docker compose -f docker-compose.local.yml logs --tail=100

# Stop the local stack, keeping its database
docker compose -f docker-compose.local.yml down
```

To intentionally erase only this stack's local database, use
`docker compose -f docker-compose.local.yml down -v`.
