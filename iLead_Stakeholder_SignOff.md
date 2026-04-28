# iLead — Stakeholder Sign-Off Form

**Project:** iLead — International Lead and Recruitment ROI Dashboard  
**Purpose:** Confirm key decisions before development begins. Sign-off prevents costly schema rework after week 4.  
**Reference:** `iLead_Developer_Document_Final.md` (v3.0).

---

## Section 1 — Decisions to Confirm

Please tick the option that reflects your team's preference, or amend with a comment.

### 1.1 Lead Deduplication (CIAC, Registrar)

When the same student appears at two different campaigns:

- [ ] **Option A — LINK (recommended):** One lead record, multiple `campaign touches`. ROI accuracy preserved.
- [ ] **Option B — Keep separate:** Each capture creates a new lead row. Simpler, but inflates "Total Leads".

> Default in doc: **Option A**.

---

### 1.2 Mandatory Lead Identifier (CIAC)

What is the minimum identifier required to capture a lead at a fair?

- [ ] At least one of: **email / phone / passport / external ID** (recommended; flexible at events).
- [ ] **Email only** (strict; may force staff to use placeholder emails).
- [ ] Custom: ____________________________________

> Default in doc: at-least-one rule.

---

### 1.3 SIS Integration in V1 (Registrar / IT)

How will application/offer/enrolment data enter iLead in V1?

- [ ] **CSV upload only** in V1; SIS read-only API in V2 (recommended; faster delivery).
- [ ] **CSV + SIS read-only API** in V1 (requires SIS team commitment + access by week 4).

> Default in doc: CSV in V1, SIS in V2.  
> If SIS API in V1, please name SIS contact: ______________________________

---

### 1.4 Faculty Dean Visibility on Umbrella Campaigns (DVC / Deans)

A "CIAC umbrella" campaign is mapped to multiple faculties. When a Dean opens their dashboard:

- [ ] See **only campaigns linked to my faculty** (recommended, default).
- [ ] See **all umbrella campaigns** even if my faculty is not listed.
- [ ] Configurable per dean (admin sets).

> Stored as `SystemSetting.faculty_dean.umbrella_visibility`. Editable later by Super Admin.

---

### 1.5 PII Export Permissions (DPO / IT)

Which roles may export passport / phone / email lists as CSV?

- [ ] `SUPER_ADMIN` + `CIAC_ADMIN` (recommended default).
- [ ] `SUPER_ADMIN` only (most restrictive).
- [ ] Add: `REGISTRAR`, `FINANCE` (not recommended).

Every export will be **audit-logged with user, IP, timestamp, exported entity IDs**.

---

### 1.6 SLA — First Follow-up Time per Lead Quality (CIAC)

How many calendar days from lead capture before a lead is "overdue"?

| Lead Quality | Default | Your Decision |
|---|---|---|
| HOT  | 1 day  | __________ |
| WARM | 3 days | __________ |
| COLD | 7 days | __________ |

- [ ] Use calendar days (recommended).
- [ ] Use business days only (excludes Sat/Sun).

---

### 1.7 ROI Revenue Basis (DVC / Management)

Which revenue figure is the **primary** ROI number on the executive dashboard?

- [ ] **First-year tuition revenue** (conservative, easy to verify) — recommended default.
- [ ] **Full-programme tuition revenue** (long-term view).
- [ ] **Net of scholarships** (gross − scholarship value) — recommended in addition.
- [ ] Show all three side by side.

> Default in doc: first-year + full-programme shown together; both net of scholarship.

---

### 1.8 Hosting & Domain (UUM IT / DPO)

Where will iLead be hosted?

- [ ] **UUM internal server** (preferred for PDPA / PII).
- [ ] **External VPS** at `ilead.uum.edu.my` (faster to start; PDPA review required).
- [ ] **Cloud (AWS / Azure / GCP)** — confirm region in Asia-Pacific.

Domain: `ilead.uum.edu.my`  
DNS owner: __________________________  
SSL: Let's Encrypt / UUM PKI (circle one).  
SMTP for outbound email: `no-reply@uum.edu.my` via Microsoft 365 / Zoho (circle one).

---

### 1.9 Backup & Data Retention (DPO / IT)

- [ ] Daily backups retained **30 days** + monthly retained **12 months** (recommended default).
- [ ] Other: __________________________________________________________________

PII auto-anonymization after **____ years** of inactivity (default 5).

---

### 1.10 SSO Timeline (UUM IT)

- [ ] V1 launches with **email/password only**; UUM Microsoft Entra SSO added in V2 (recommended).
- [ ] V1 must include SSO. SSO contact: __________________________________________

---

### 1.11 Branding (UUM Comms)

- [ ] UUM brand pack (logo SVG, hex codes, fonts) provided to developer by **week 2**.
- [ ] Use placeholder branding for now; brand audit in production hardening phase.

Primary colour (hex): __________  Secondary (hex): __________  
Heading font: __________________  Body font: ____________________

---

### 1.12 V1 Scope Confirmation (All)

Tick to confirm V1 includes (per `iLead_Developer_Document_Final.md` §17):

- [x] Login + role-based access
- [x] Master data (Country, Faculty, Programme, Currency, FX, Tuition, Scholarship, Sponsor)
- [x] Campaign + multi-faculty + multi-programme + multi-country
- [x] Lead capture (form + CSV upload + dedup + merge queue)
- [x] Follow-up + SLA + overdue + in-app notifications
- [x] Application / Offer / Enrolment upload + matching
- [x] Currency-aware costs + ROI engine + scholarship-adjusted revenue
- [x] Campaign metrics summary table + executive / faculty / operational dashboards
- [x] Audit log + soft delete + retention job
- [x] Excel/CSV/PDF export

V2 (post-V1): SSO, SIS API, WhatsApp, AI lead scoring, Metabase / Power BI, PWA.

Any V1 items to remove or V2 items to promote? ____________________________________________

---

## Section 2 — Sign-Off

| Stakeholder | Name | Signature | Date |
|---|---|---|---|
| CIAC Lead | | | |
| Registrar / Admission Lead | | | |
| Finance Lead | | | |
| Faculty Dean (representative) | | | |
| DVC / Management Sponsor | | | |
| UUM IT / Hosting Owner | | | |
| UUM DPO (Data Protection) | | | |
| UUM Comms (Branding) | | | |
| Project Developer | | | |

---

## Section 3 — Notes / Amendments

_Use this space to record any additional decisions, concerns, or scope changes:_

```
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________
________________________________________________________________________________
```

---

**Once all parties have signed:**

1. Developer commits `prisma/schema.prisma` matching `iLead_Developer_Document_Final.md` §7.
2. Run `npx prisma migrate dev --name init` then `npm run seed`.
3. Stage 1 (V1 MVP) build begins per the 14-week plan in §21.
