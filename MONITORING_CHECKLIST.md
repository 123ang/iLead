# iLead Monitoring Checklist

## API and frontend

- `/health` checked at least every minute by uptime monitoring.
- PM2 process `ilead-api` configured to restart on crash.
- Nginx access and error logs retained for incident review.
- Alert on repeated HTTP 5xx responses.
- Alert on login failure spikes.

## Database

- Alert on PostgreSQL down or connection saturation.
- Track database disk usage and backup directory growth.
- Verify latest backup age is less than 24 hours.
- Run a restore drill before launch and after major schema changes.

## Business controls

- Review `EXPORT_CSV` audit logs weekly.
- Review unresolved duplicate queue volume weekly.
- Review overdue follow-up SLA report daily during recruitment periods.
- Refresh campaign metric snapshots daily after business close.
