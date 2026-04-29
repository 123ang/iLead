# iLead Production Environment Checklist

## Required environment

- `NODE_ENV=production`
- `PORT=3003`
- `DATABASE_URL=postgresql://...`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` set to long random values
- `FRONTEND_URL=https://<production-domain>`
- `TRUSTED_ORIGINS=https://<production-domain>`
- SMTP variables populated before enabling password reset email delivery
- Backup destination mounted and writable by the deployment user

## Deployment checks

- `npm ci` completed on the release artifact.
- `npm run prisma:generate` completed.
- `npm run prisma:validate` completed.
- `npm run db:migrate` or `npx prisma migrate deploy --schema backend/prisma/schema.prisma` completed.
- `npm run build` completed.
- PM2 process `ilead-api` is online.
- Nginx config validates with `nginx -t`.
- `/health` returns `{ "ok": true }`.
- Seed/demo credentials are disabled or changed in production.

## Security checks

- `pii.export.allowed_roles` reviewed with CIAC and DPO.
- Audit log page is restricted to `SUPER_ADMIN` and `CIAC_ADMIN`.
- TLS certificate installed before real user access.
- Database accepts connections only from the app host or trusted network.
- Backups are encrypted or stored in a restricted location.
