# iLead Launch Checklist

## Code and release readiness

- [ ] `npm run prisma:generate` passes on the release host.
- [ ] `npm run prisma:validate` passes on the release host.
- [ ] `npx prisma migrate deploy --schema backend/prisma/schema.prisma` completes against production.
- [ ] `npm test --workspace backend` passes.
- [ ] `npm run build` passes.
- [ ] PM2 process `ilead-api` starts from `ecosystem.config.cjs`.
- [ ] Nginx config based on `deploy/nginx/ilead.conf` passes `nginx -t`.
- [ ] `/health` returns `ok: true` through Nginx.
- [ ] Daily campaign metric refresh is scheduled with `npm run metrics:refresh --workspace backend`.

## Data and access readiness

- [ ] Production admin password is changed after first login.
- [ ] Demo/sample accounts are disabled or their passwords are rotated.
- [ ] `pii.export.allowed_roles` is approved and set for launch.
- [ ] Real programme, tuition, scholarship, sponsor, and FX data has been reviewed.
- [ ] Initial campaign/import files are backed up before upload.

## Operational readiness

- [ ] Backup script has produced a verified `.dump` and `.sha256`.
- [ ] Restore drill in `RESTORE_DRILL.md` has been completed on a non-production database.
- [ ] Monitoring checks in `MONITORING_CHECKLIST.md` are active.
- [ ] TLS certificate is installed and auto-renewal is enabled.
- [ ] Nginx, PM2, PostgreSQL, and backup logs have defined owners.

## External blockers

- [ ] UUM production domain and DNS record.
- [ ] TLS certificate approval if managed by UUM IT.
- [ ] SMTP credentials for real password reset and notifications.
- [ ] Final PDPA/DPO sign-off for PII retention and export role policy.
- [ ] Stakeholder UAT sign-off from CIAC, Registrar, Finance, Deans, DVC, and IT.
- [ ] Real sample CSV/XLSX files for final upload mapping validation.
