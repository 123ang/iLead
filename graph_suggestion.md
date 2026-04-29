# iLead Executive Dashboard — Graph Proposals (with Year View)

## What data we currently have
### Backend endpoints we can reuse today
- `GET /api/dashboard/executive`  
  Totals for campaigns/leads/applications/offers/enrolments + overall ROI (single point in time).
- `GET /api/dashboard/recruitment-funnel`  
  Funnel counts (single point).
- `GET /api/campaigns/:id/roi`  
  ROI metrics for one campaign (single point).
- `GET /api/reports/country-performance` / `faculty-performance` / `programme-conversion`  
  Aggregates (no native “by-year” axis in the response shape; needs a new year-grouping endpoint).
- `GET /api/reports/follow-up-sla`  
  SLA report includes `deadline` → can be filtered by year using the report `from/to` filter.
- `GET /api/reports/scholarship-revenue`  
  Includes `enrolmentDate` → can be filtered by year using report `from/to`.
- `GET /api/reports/duplicates`  
  Includes `createdAt` → can be filtered by year using report `from/to`.

### Date fields available in the data model (for “by year” charts)
- `Lead.createdAt`
- `Application.applicationDate`, `offerDate`, `enrolmentDate`
- `Enrolment.enrolmentDate`
- `CampaignCost.costDate`
- `FollowUp.followUpDate`, `nextFollowUpDate`
- `Lead.assignedAt` (used for SLA deadline calculation)
- `CampaignMetric.metricDate` (used by metric snapshot refresh)
- `LeadCampaignTouch.capturedAt` (if you want “campaign touch timeline”)

> Key implication: For true “by-year” charts, we either (a) compute aggregates from these date fields, or (b) reuse report endpoints only when their responses include a filterable date (`deadline`, `enrolmentDate`, `createdAt`, `metricDate`).

## Graphs I propose (and what we can generate “by year”)

### 1) Pipeline Trend by Year (Leads → Applications → Offers → Enrolments)
- **Chart type:** Multi-series line chart or grouped bars per year
- **Data inputs:**  
  - Leads: `Lead.createdAt`
  - Applications: `Application.applicationDate`
  - Offers: `Offer` linked through `Application` (offer date)
  - Enrolments: `Enrolment.enrolmentDate`
- **Backend approach:** New endpoint like `GET /api/dashboard/pipeline-by-year?fromYear=&toYear=` that aggregates counts per year.
- **Why it’s exec-friendly:** Shows momentum over time, not just current totals.

### 2) ROI by Year (Explained via Spend vs Revenue)
- **Chart type:** ROI columns per year + optional tooltip values
- **Data inputs (recommended):**
  - Spend: sum `CampaignCost.amountMyr` grouped by `CampaignCost.costDate`
  - Revenue: sum `Enrolment.netTuitionMyr` grouped by `Enrolment.enrolmentDate`
  - ROI computed from the totals (same logic as your ROI service)
- **Backend approach:** New endpoint like `GET /api/dashboard/roi-by-year`.
- **Alternative (if you want “stored” snapshots):**
  - Use `CampaignMetric.metricDate` (after running metric refresh) and aggregate metrics per year.

### 3) Overdue Follow-ups by Year (SLA Health)
- **Chart type:** Stacked bars (HOT/WARM/COLD) or “Overdue vs Within SLA” per year
- **Data inputs:**
  - SLA deadline logic uses: `Lead.assignedAt`, `Lead.leadQuality`, latest `FollowUp.nextFollowUpDate`
- **Backend approach:** New endpoint like `GET /api/reports/follow-up-sla-by-year` OR compute “overdue-at-year-end” with a `now` parameter.
- **Reusing existing report (partial):**
  - `GET /api/reports/follow-up-sla` already returns items with `deadline`, so you *can* filter by year using the existing `from/to` query parameters, but that’s “report rows filtered”, not “grouped into year buckets”.

### 4) Enrolments by Year (Overall + by Programme)
- **Chart type:** Line chart (overall enrolments per year) + bar chart (top programmes for that year)
- **Data inputs:**
  - Overall: `Enrolment.enrolmentDate`
  - Programme dimension: `Enrolment.programmeId` (or derive via relations)
- **Backend approach:**  
  - `GET /api/dashboard/enrolments-by-year`
  - `GET /api/dashboard/enrolments-by-year-programme?topN=...`

### 5) Enrolments by Country (100% Stacked) over Years
- **Chart type:** 100% stacked bars per year (top N countries + “Other”)
- **Data inputs:**
  - Country comes from `Enrolment.application.countryId` (via relations)
  - Date axis: `Enrolment.enrolmentDate`
- **Backend approach:** New endpoint like `GET /api/dashboard/enrolments-by-country-by-year?topN=5`.

### 6) Cost Breakdown by Year (Spend by Cost Type)
- **Chart type:** Stacked bar per year by `CampaignCost.costType`
- **Data inputs:** `CampaignCost.costDate`, `CampaignCost.costType`, `CampaignCost.amountMyr`
- **Backend approach:** New endpoint like `GET /api/dashboard/cost-breakdown-by-year`.

### 7) Optional Yearly “Program Conversion” View
(Useful as a supporting slide, less critical than pipeline/ROI)
- **Chart type:** Bars by year: Applicants/Applications → Enrolments conversion rate
- **Data inputs:** Applications/enrolments dates + programme dimension
- **Backend approach:** New year-grouping endpoint (because your current conversion report output isn’t structured as time-series buckets).

## Which ones you can generate fastest right now
- **Fastest (reusing existing report endpoints + `from/to` filters):**
  - Overdue SLA health (from `follow-up-sla`, grouped by year requires a small “grouping” change or multiple calls)
  - Scholarship revenue per year (from `scholarship-revenue`, since it includes `enrolmentDate`)
  - Duplicates created per year (from `duplicates`, since it includes `createdAt`)
- **Best “single dashboard charts” by year (will likely need new endpoints):**
  - Pipeline by year
  - ROI by year (and spend vs revenue by year)
  - Enrolments by country/programme by year
  - Cost breakdown by year

## One decision needed: calendar year vs academic/fiscal year
- Default below assumes **calendar year** (e.g. 2023, 2024, 2025).
- If you prefer **academic year** (e.g. Aug–Jul), we’ll shift the bucket boundaries in the backend aggregation.