# iLead Restore Drill

Run this drill before launch and repeat after schema changes.

1. Create a fresh backup:

```bash
DATABASE_URL=postgresql://ilead_user:password@localhost:55432/ilead_db \
  ./scripts/backup-postgres.sh
```

2. Provision an empty drill database.

3. Restore the backup into the drill database:

```bash
DATABASE_URL=postgresql://ilead_user:password@localhost:55432/ilead_restore_drill \
  ./scripts/restore-postgres.sh backups/ilead-YYYYMMDDTHHMMSSZ.dump
```

4. Run verification:

```bash
DATABASE_URL=postgresql://ilead_user:password@localhost:55432/ilead_restore_drill \
  npm run prisma:validate
DATABASE_URL=postgresql://ilead_user:password@localhost:55432/ilead_restore_drill \
  npm run test:smoke
```

5. Record the backup filename, restore duration, smoke-test result, and any manual fixes required.

Current sandbox note: database restore cannot be verified here because PostgreSQL startup is blocked by shared-memory restrictions.
