# iLead Issues Found

Date: 2026-04-29 23:04 MYT  
Repository: `/Users/123ang/Desktop/Websites/iLead`  
Branch: `main`  
Latest checked commit: `a439e68 Update deploy.sh`

## Verification Summary

The codebase is currently working in local verification.

Passed checks:

```bash
npm run prisma:generate
npm run prisma:validate
npm test --workspace backend
npm run build
npm run db:up
npm run db:migrate
npm run db:seed
API_BASE=http://127.0.0.1:3103 ORIGIN=http://127.0.0.1:5174 npm run test:smoke --workspace backend
E2E_BASE_URL=http://127.0.0.1:5174 npm run test:e2e --workspace frontend
```

Backend tests: 28 passed.  
Frontend E2E upload flow: passed.  
Dashboard yearly graph APIs: tested live and returned successfully.

---

## Issues / Risks Found

## 1. High Severity `xlsx` Dependency Vulnerability

**Severity:** High  
**Area:** Security / file upload  
**Status:** Open

`npm audit --omit=dev` reports one high-severity vulnerability from `xlsx`.

Affected usage:

- `backend/package.json`
- `frontend/package.json`
- `backend/src/services/upload.service.js`
- `frontend/src/pages/ApplicationUploadPage.jsx`

Risk:

- The app accepts uploaded CSV/XLSX files.
- Vulnerable spreadsheet parsing libraries are higher risk because uploaded files are user-controlled input.
- Audit reports prototype pollution and ReDoS advisories for the installed `xlsx` package range.

Recommendation:

- Prefer replacing `xlsx` with a maintained safer parser, or temporarily disable XLS/XLSX uploads and allow CSV only.
- If XLSX must remain for MVP, add strict file size limits, row limits, extension/MIME validation, and document the accepted risk before production.

---

## 2. Production `DATABASE_URL` Fallback Is Risky

**Severity:** High for production  
**Area:** Configuration / deployment safety  
**Status:** Open

`backend/src/config/db.js` currently sets a default local database URL when `DATABASE_URL` is missing:

```js
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://ilead_user:password@127.0.0.1:55432/ilead_db";
}
```

Risk:

- This is convenient for local development.
- In production, missing `DATABASE_URL` should fail fast instead of silently connecting to a default/local database.
- A misconfigured server could start against the wrong DB or fail later in confusing ways.

Recommendation:

- Keep fallback only for development/test.
- In `NODE_ENV=production`, throw a clear startup error if `DATABASE_URL` is missing.

Suggested logic:

```js
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production.");
  }
  process.env.DATABASE_URL =
    "postgresql://ilead_user:password@127.0.0.1:55432/ilead_db";
}
```

---

## 3. Deploy Script Port Mismatch

**Severity:** Medium / High for deployment  
**Area:** Deployment  
**Status:** Resolved

Backend port **`4016`** is aligned across `deploy.sh` (`BACKEND_PORT`), `ecosystem.config.cjs`, `backend/.env.example`, `backend/src/config/env.js` default, `deploy/nginx/ilead.conf`, `deploy.md`, and related docs. Production `backend/.env` and live Nginx `proxy_pass` must still use the same `PORT`.

---

## 4. Upload Endpoint Uses Memory Storage Without File Size Limit

**Severity:** Medium / High  
**Area:** Security / reliability  
**Status:** Open

`backend/src/routes/application.routes.js` uses:

```js
const upload = multer({ storage: multer.memoryStorage() });
```

Risk:

- Uploaded files are held in memory.
- No explicit size limit exists.
- A large file could cause high memory usage or crash the backend process.

Recommendation:

Add strict upload limits, for example:

```js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});
```

Also add:

- Row count limit
- Header count limit
- Allowed extension/MIME check
- Clear error response when file is too large

---

## 5. Frontend Bundle Size Warning

**Severity:** Medium  
**Area:** Frontend performance  
**Status:** Open

The frontend build passes, but Vite warns that the JS bundle is larger than 500 KB.

Observed bundle size:

- Main JS around `1.2 MB`
- Gzip around `359 KB`

Risk:

- Slower initial load.
- Dashboard now imports many `recharts` components and graph-heavy code.

Recommendation:

- Add route-level code splitting using `React.lazy` and `Suspense`.
- Lazy-load heavy pages like Dashboard, Reports, Campaign Detail, Application Upload.
- Consider separating `recharts` into a manual chunk.

---

## 6. Prisma Package Config Deprecation Warning

**Severity:** Low  
**Area:** Maintenance  
**Status:** Open

Prisma prints this warning:

```text
The configuration property package.json#prisma is deprecated and will be removed in Prisma 7.
```

Risk:

- Not urgent now.
- Future Prisma 7 upgrade may break seed config.

Recommendation:

- Move Prisma seed/config to a dedicated Prisma config file when preparing for Prisma 7.

---

## 7. Test Coverage Still Has Gaps

**Severity:** Medium  
**Area:** QA / launch readiness  
**Status:** Open

Current backend unit tests pass, and one Playwright upload E2E test passes. However several important areas still need stronger coverage.

Missing or incomplete test areas:

- Auth and RBAC integration tests
- Refresh rotation/logout/password reset tests
- Lead validation, assignment, SLA, and status transition tests
- Upload validation + matching + conflict review integration tests
- Dashboard metrics accuracy tests
- Currency FX conversion and frozen MYR amount tests
- Soft delete tests
- Timezone rendering/storage tests
- Performance test with larger seeded data

Recommendation:

Before production launch, add integration tests for the flows that affect permissions, financial/ROI data, and uploaded student records.

---

## 8. Server-side Pagination/Search Still Incomplete

**Severity:** Medium  
**Area:** Scalability / UX  
**Status:** Open

Several frontend list pages use client-side filters/search/pagination. This is acceptable for MVP demo data but weak for production data volume.

Affected areas include:

- Campaign list
- Lead list
- Master data lists

Recommendation:

Add server-side pagination, filtering, and search for high-volume tables, especially leads and applications.

---

## 9. Background Jobs Still Not Complete

**Severity:** Medium  
**Area:** Operations / automation  
**Status:** Open

Still incomplete:

- Overdue digest job
- Weekly campaign summary job
- PII retention/anonymization job
- Production verification of cron/PM2 scheduled jobs

Recommendation:

For MVP launch, decide whether these are required for V1 or documented as post-launch jobs. PII retention/anonymization should be treated seriously for PDPA/privacy readiness.

---

## 10. External Launch Dependencies Still Open

**Severity:** Launch blocker, but external  
**Area:** Production launch  
**Status:** Open

These cannot be completed by code alone:

- UUM brand pack: logo SVG, official colours, fonts
- Domain/DNS decision
- SMTP credentials for real email
- Real sample CSV/XLSX files for upload mapping validation
- Hosting decision
- PDPA review
- Stakeholder sign-off from CIAC, Registrar, Finance, Deans, DVC, IT/DPO

Recommendation:

Track these separately from code tasks so the software can be marked MVP-ready while launch approval remains externally pending.

---

# Recommended Fix Order

1. Fix or remove vulnerable `xlsx` usage.
2. Make `DATABASE_URL` required in production.
3. Resolve deployment port mismatch.
4. Add upload file size/row limits.
5. Add route-level frontend code splitting.
6. Add critical integration tests.
7. Complete or explicitly defer background jobs.
8. Resolve external launch dependencies.

---

# Current Overall Assessment

The iLead codebase is working locally and has passed the main verification gates. It is suitable for continued MVP/UAT work.

However, it is **not yet fully production-launch ready** because of the `xlsx` security issue, deployment config mismatch, upload hardening gap, and remaining launch/test coverage gaps.
