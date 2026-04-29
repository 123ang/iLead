# iLead UAT Checklist

## Access and roles

- Log in as Super Admin and confirm dashboard, users, settings, reports, and audit logs are visible.
- Log in as CIAC Admin and confirm campaign, lead, duplicate, upload, and report workflows are available.
- Log in as Faculty Dean and confirm only faculty-linked leads/campaigns are visible.
- Log in as Staff and confirm assigned leads are visible while admin-only pages are hidden.

## Campaign and leads

- Create a campaign with country, faculty, and programme mappings.
- Add campaign costs and confirm actual spend updates.
- Create a lead with at least one identifier.
- Reject a lead with no email, phone, passport number, or external lead ID.
- Assign a lead to staff and confirm assigned date is set.
- Add follow-up activity and confirm SLA status changes.

## Applications and matching

- Upload application CSV using the documented template.
- Confirm row-level validation errors are shown for bad data.
- Match applications to leads by email, phone, passport, and fallback fields.
- Confirm unmatched applications remain reviewable.

## Duplicates

- Create two leads with the same email and confirm a duplicate candidate appears.
- Merge a duplicate and confirm campaign touches move to the primary lead.
- Reject a non-duplicate and confirm it leaves the pending queue.

## Reports and exports

- Open each report: country performance, faculty performance, programme conversion, follow-up SLA, duplicates, scholarship revenue.
- Confirm table filters work.
- Export CSV as Super Admin and confirm audit log records `EXPORT_CSV`.
- Attempt a PII export as an unauthorized role and confirm it is blocked.
- Refresh campaign metric snapshots and confirm the route returns updated rows.

## Launch sign-off

- CIAC signs off recruitment workflow.
- Registrar signs off upload/matching workflow.
- Finance signs off cost and scholarship-adjusted revenue workflow.
- DPO or equivalent signs off PII export roles and retention.
