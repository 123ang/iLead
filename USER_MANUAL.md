# iLead — First-Time User Manual

This guide explains the main screens, core terms, and a recommended “first workflow” so a new user can get started quickly.

## 1) What is iLead?
iLead is an executive portal to manage recruitment performance:
- Define **Campaigns** and their scope (Country / Faculty / Programme)
- Create or manage **Leads**
- Import **Applications** (CSV/XLSX), then **match** them to existing Leads
- Resolve **conflicts** (manual review)
- Track **Follow-ups** and SLA health (overdue queue)
- Review **Duplicate Leads** and handle merges/rejections
- Run **Reports** and export CSV

## 2) Sign in
1. Open the app in your browser.
2. Log in with:
   - `admin@ilead.local`
   - `iLead2026!`

> After you set up your own users/roles, use those accounts instead of the demo.

### Must-change password
If your account is flagged to require a password change, the system will redirect you to the Change Password page.

## 3) How the UI works (important)
Many create/edit forms open in a **center pop-up** modal (not a right-side drawer):
- Click “New …” / Edit buttons to open the form
- Use **Cancel** or the close (X) button to exit
- Save to persist changes

## 4) Roles & permissions (high level)
Not every page is visible for every role.
- **Executive / admin roles** can manage most entities and export/report at deeper levels.
- Some pages (like Master Data and Users) are restricted to specific admin roles.

If a page is missing from the navigation, your role likely doesn’t have permission for it.

## 5) Core terms (you’ll see these everywhere)

### Campaign
A recruitment initiative with:
- **Type** (e.g. education fair, university visit, etc.)
- **Status** (PLANNED / ONGOING / COMPLETED / CANCELLED)
- **Timeline** (start/end date)
- **Scope**:
  - Countries
  - Faculties
  - Programmes

### Lead
A student/applicant identity record (the “student profile”).
Leads can have identifiers such as:
- Email
- Phone
- Passport number
- External Lead ID

### Lead status & lead quality (SLA health)
The SLA/overdue logic is based on:
- Active statuses (typically NEW, CONTACTED, INTERESTED)
- Lead quality bucket: **HOT**, **WARM**, **COLD**

SLA business days (default, from system rules):
- **HOT = 1 day**
- **WARM = 3 days**
- **COLD = 7 days**

### Application
An application submitted by a candidate (typically imported via CSV/XLSX).
Application fields include:
- Applicant name
- Email / phone / passport (optional)
- Application status (APPLIED → …)
- Application date / offer date / enrolment date (optional)

### Matching (Application → Lead)
After importing applications, iLead attempts to match each imported Application row to an existing Lead using a priority order:
1. Exact **email**
2. Exact **phone**
3. Exact **passport number**
4. Name + Programme + Country fallback
5. Source campaign name fallback

Matching outcomes you’ll see on the upload report:
- **MATCHED**: linked to an existing Lead
- **CONFLICT**: multiple possible Leads found (manual review needed)
- **CREATED**: no match found yet (application exists but Lead linkage is missing)
- **FAILED**: row-level validation failed

### Conflict / Manual review
If a row is **CONFLICT**, you will choose the correct Lead from a dropdown, then click **Resolve**.

### Follow-up
Follow-ups are actions scheduled for a Lead.
- You can update details or complete the latest follow-up.
- The Follow-ups page includes an **Overdue** queue.

### Duplicate Leads
Some Leads are suspected duplicates.
If you are allowed, you can:
- **Merge**: accept/link duplicates to one identity
- **Reject**: mark as NOT_DUPLICATE

## 6) Navigation map (what to do on each page)

### Dashboard
High-level executive overview. (You can view yearly graphs as well.)

### Campaigns
Manage campaigns:
1. Create a campaign
2. Edit its scope
3. Add/delete costs
4. Check ROI (where available)

### Leads
Manage leads:
- Filter/search
- Create a lead manually
- Edit/soft-delete

### Applications (Upload)
Import application files and run matching:
- Upload CSV/XLSX
- Auto-detect headers
- Adjust column mapping (optional)
- Review the “Validation + Matching Report”
- Resolve conflicts inline
- Rematch unmatched rows if needed
- Roll back a batch if necessary

### Follow-ups
- Open the overdue queue
- Edit/complete the latest follow-up

### Duplicates
Review merge queue and handle merge/reject actions.

### Reports
- Select report type
- Use filters (search + date range)
- Export CSV (with PII rules where applicable)

### Master Data
Admin configuration:
- Countries, Faculties, Programmes
- Currencies & FX rates
- Tuition fees
- Scholarships
- Sponsors

### Users
Create/edit/deactivate user accounts (admin-only).

### Settings
System configuration values (admin-only).

### Audit Logs
Track create/update/delete actions and report export events (admin-only).

## 7) First-time walkthrough (recommended path)

### Step A — (Optional) Use the demo seed
If you already ran the demo database seed, you can explore immediately.

### Step B — Create/confirm Master Data (if you’re not using demo)
1. Go to **Master Data**
2. Ensure:
   - Countries, Faculties, Programmes exist
   - Currencies, FX rates exist (used for cost conversions)

### Step C — Create your first Campaign
1. Go to **Campaigns**
2. Click **New Campaign**
3. Fill:
   - Campaign name
   - Type & Status
   - Start/End dates
   - Approved Budget (MYR)
4. Choose scope using tickable dropdowns:
   - Countries
   - Faculties
   - Programmes
5. Click **Create Campaign**

### Step D — Add Leads (so matching has candidates)
1. Go to **Leads**
2. Click create, and enter at least one identifier:
   - Email OR phone OR passport number OR External Lead ID
3. Save

### Step E — Upload Applications and match
1. Go to **Applications**
2. Choose a CSV/XLSX file
3. Confirm header mapping (you can change it if needed)
4. Click **Upload**
5. On the “Validation + Matching Report”:
   - Review FAILED rows (fix and re-upload)
   - For CONFLICT rows, choose the correct Lead and click **Resolve**
   - Use **Rematch Unmatched** if needed

### Step F — Overdue follow-ups
1. Go to **Follow-ups**
2. Open the overdue queue
3. Edit/complete the latest follow-up

### Step G — Reports
1. Go to **Reports**
2. Choose a report
3. Set date filters
4. Export CSV if you’re allowed

## 8) Application Upload format (CSV template)
On the Applications Upload page, the system expects (by header names) fields such as:
- `applicantName`, `email`, `phone`, `passportNumber`, `country`,
  `programmeCode`, `studyLevel`, `applicationStatus`,
  `applicationDate`, `offerDate`, `enrolmentDate`,
  `sourceCampaign`, `scholarshipMyr`, `tuitionRevenueMyr`

The UI can also remap headers via **Column mapping**.

### Minimal approach
You can leave optional columns blank. If identifier fields are blank, matching may be impossible and the result may be CREATED/unmatched.

## 9) Common troubleshooting

### “CONFLICT” rows
This means the imported row could match multiple Leads. Resolve using the dropdown and click **Resolve**.

### “FAILED” rows
Row-level validation errors occurred (e.g. invalid date or missing required application fields). Fix the source file and re-upload.

### Rollback batch
If you imported the wrong file, use **Rollback Batch** (admin roles only) to delete the created applications for that batch.

## 10) Support
If something looks wrong:
1. Check your role permissions (some actions are restricted)
2. Confirm your file headers match the mapping UI
3. If dates cause issues, ensure ISO-ish formats (YYYY-MM-DD for dates)

