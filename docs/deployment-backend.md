# Backend Deployment

## Required build/start commands

- Install/build command: `npm install`
- Start command: `npm start`
- Migration command: `npm run migrate:deploy`

`postinstall` runs `prisma generate`, so the Prisma client is generated after installing dependencies.

If you deploy with Render Blueprints, the repository includes `render.yaml` with:

- `buildCommand: npm install`
- `preDeployCommand: npm run migrate:deploy`
- `startCommand: npm start`
- `healthCheckPath: /api/health`

## Required environment variables

Use `.env.example` as the base. In production, configure at least:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` or `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`

## Neon database

The database is PostgreSQL hosted on Neon. Use the Neon connection string in `DATABASE_URL` and keep `sslmode=require`.

## Deployment order

1. Configure environment variables in the hosting provider.
2. Install dependencies with `npm install`.
3. Run migrations with `npm run migrate:deploy`.
4. Start the server with `npm start`.
5. Verify `/api/health`.

## Render variables

The `render.yaml` file marks real secrets with `sync: false`, so Render asks for them in the dashboard instead of storing them in Git. Values generated with `generateValue: true` are created by Render automatically.
