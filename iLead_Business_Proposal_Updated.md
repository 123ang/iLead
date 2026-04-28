# iLead Business Proposal

## International Lead and Recruitment ROI Dashboard for UUM

**Project Name:** iLead  
**Full Name:** International Lead and Recruitment ROI Dashboard  
**Purpose:** To track UUM's international recruitment activities from campaign planning until student enrolment, tuition revenue, and return on investment (ROI).  
**Recommended Duration:** 6 months for research prototype; 14 to 18 weeks for MVP development, depending on scope discipline.  
**Recommended Budget:** RM30,000 for research grant prototype; RM35,000 to RM45,000 for stronger production-ready implementation.

---

## 1. Executive Summary

iLead is a proposed web-based analytics dashboard for Universiti Utara Malaysia (UUM) to measure the effectiveness and ROI of international student recruitment and internationalisation activities.

UUM conducts many overseas activities such as education fairs, university visits, academic collaboration meetings, agency engagement, and international exhibitions. These activities require budgets for travel, accommodation, promotion, registration fees, staff time, and follow-up work. Current proposal papers usually record the planned activity, expected KPI, delegation, and estimated budget. However, the post-event outcome is often not systematically connected to student leads, applications, offers, enrolments, tuition income, and campaign ROI.

iLead solves this by creating a structured flow:

**Campaign -> Lead -> Follow-up -> Application -> Offer -> Enrolment -> Revenue -> ROI**

The system will allow top management, CIAC, faculties, programme coordinators, and admission teams to know which countries, campaigns, faculties, programmes, and activities produce the strongest results.

---

## 2. Business Problem

At present, the international recruitment reporting process is mainly activity-based. UUM can usually identify:

- where the delegation travelled;
- who attended the activity;
- what activities were conducted;
- what budget was approved;
- what KPI targets were proposed.

However, UUM may not have a single dashboard to answer these questions clearly:

- How many student leads were collected from each campaign?
- How many leads were contacted within the follow-up SLA?
- How many leads applied to UUM?
- How many applications became offers?
- How many offers became enrolments?
- Which country produced the lowest cost per enrolled student?
- Which programme generated the highest tuition return?
- Which faculty benefited from CIAC umbrella campaigns?
- How should scholarships or sponsored students affect ROI?
- Is ROI based on first-year tuition or full programme revenue?

Without a closed-loop tracking system, management cannot fully evaluate whether international marketing spending is producing measurable recruitment value.

---

## 3. Proposed Solution

The proposed solution is **iLead**, an integrated international lead and recruitment ROI dashboard.

The system will include:

1. Campaign registration and budget tracking.
2. Country, faculty, programme, and campaign master data.
3. Multi-faculty and multi-programme campaign mapping.
4. Mobile-friendly lead capture form.
5. Lead deduplication and merge workflow.
6. Staff assignment and follow-up tracking.
7. Application, offer, and enrolment upload or system integration.
8. Tuition fee, scholarship, sponsor, and currency handling.
9. ROI calculation engine.
10. Campaign metrics summary table for dashboard performance.
11. Executive, faculty, operational, and report views.
12. Role-based access control, audit logging, backup, and PDPA-aware governance.

---

## 4. Business Objectives

The objectives of iLead are:

1. To centralise international recruitment campaign records.
2. To capture and track prospective international student leads.
3. To monitor staff follow-up and reduce lost leads.
4. To match leads with application, offer, and enrolment records.
5. To calculate campaign ROI using consistent metrics.
6. To compare performance by country, city, faculty, programme, and campaign type.
7. To help UUM allocate international marketing budgets based on evidence.
8. To improve accountability and reporting for internationalisation activities.

---

## 5. Scope of the System

### 5.1 In Scope

- Campaign creation and approval data entry.
- Multi-country, multi-faculty, and multi-programme campaign mapping.
- Lead capture and Excel/CSV upload.
- Lead deduplication and manual merge queue.
- Follow-up assignment, SLA, overdue alerts, and notes.
- Application, offer, and enrolment upload.
- Tuition fee, scholarship, sponsor, and revenue assumptions.
- Currency and FX handling for campaign costs.
- ROI calculation and dashboard visualisation.
- Exportable reports in Excel, CSV, and PDF.
- Audit logs and soft delete.
- User roles and access control.

### 5.2 Out of Scope for MVP

- Full automatic SIS integration, unless data access is approved early.
- WhatsApp API automation.
- AI prediction of lead quality.
- Mobile app version.
- Advanced Power BI or Metabase integration.

These can be added in Version 2.

---

## 6. Target Users and Access

| User Group | Main Usage |
|---|---|
| DVC / Management | View executive ROI, country performance, and strategic outcomes. |
| CIAC Admin | Manage campaigns, leads, follow-ups, and reports. |
| Faculty Dean | View faculty-linked campaign performance, including CIAC umbrella campaigns mapped to the faculty. |
| Programme Coordinator | View programme-specific leads and conversion. |
| Marketing Staff / Academic Staff | Capture leads and update follow-up status. |
| Registrar / Admission Office | Upload or verify application, offer, and enrolment data. |
| Finance Office | Upload approved and actual campaign costs, currency, and MYR equivalent. |
| System Admin | Manage users, roles, master data, backups, and audit logs. |

---

## 7. Business Flow

```text
1. Campaign is proposed and approved.
2. Campaign is created in iLead.
3. Campaign is linked to countries, faculties, and target programmes.
4. Approved budget, actual spending, currency, and FX rate are entered.
5. Staff attend the campaign or international event.
6. Leads are captured using a mobile form or uploaded by CSV/Excel.
7. System checks for duplicate leads across campaigns.
8. Leads are assigned to staff or programme coordinators.
9. Staff follow up with students within the SLA.
10. Student applies to UUM.
11. Application data is uploaded or integrated.
12. System matches leads with applications.
13. Offer and enrolment data are updated.
14. Tuition, scholarship, and sponsor data are applied.
15. Campaign metrics table is refreshed.
16. Management views ROI dashboard and campaign reports.
```

---

## 8. Metrics to be Measured

### 8.1 Recruitment Funnel Metrics

| Metric | Formula / Definition |
|---|---|
| Total Leads | Count of captured leads, after deduplication rules. |
| Qualified Leads | Leads marked Hot or Warm. |
| Total Applications | Applications linked to campaign leads. |
| Total Offers | Offers issued to linked applicants. |
| Total Enrolments | Students registered as enrolled. |
| Lead-to-Application Rate | Applications / Leads x 100%. |
| Application-to-Offer Rate | Offers / Applications x 100%. |
| Offer-to-Enrolment Rate | Enrolments / Offers x 100%. |
| Overall Conversion Rate | Enrolments / Leads x 100%. |
| Drop-off Rate by Stage | Leads lost at each funnel stage. |

### 8.2 Financial and ROI Metrics

| Metric | Formula / Definition |
|---|---|
| Approved Budget | Budget approved for the campaign. |
| Actual Spend | Actual amount spent. |
| Cost in Original Currency | Raw cost such as IDR, USD, EUR, JPY. |
| MYR Equivalent Cost | Original cost converted using stored FX rate. |
| Cost per Lead | MYR Campaign Spend / Leads. |
| Cost per Application | MYR Campaign Spend / Applications. |
| Cost per Enrolled Student | MYR Campaign Spend / Enrolments. |
| First-Year Tuition Revenue | Sum of first-year tuition after scholarship adjustment. |
| Full-Programme Revenue | Sum of expected total programme tuition after scholarship adjustment. |
| Net Return | Revenue - Campaign Spend. |
| ROI Ratio | Revenue / Campaign Spend. |
| ROI Percentage | Net Return / Campaign Spend x 100%. |

### 8.3 Scholarship and Sponsor Metrics

| Metric | Definition |
|---|---|
| Scholarship Count | Number of enrolled students receiving scholarship. |
| Scholarship Value | Estimated tuition discount or subsidy. |
| Net Tuition Revenue | Gross tuition minus scholarship value. |
| Sponsored Student Count | Students funded by agencies or government sponsors. |
| Revenue Type | Self-funded, sponsored, scholarship, fee waiver, exchange/non-revenue. |

### 8.4 Operational Metrics

| Metric | Definition |
|---|---|
| Average First Response Time | Time from lead capture to first contact. |
| SLA Compliance Rate | Leads contacted within target SLA, e.g. 3 days. |
| Overdue Leads | Leads with nextFollowUpDate before today or New leads older than SLA. |
| Leads Not Contacted | Leads with no follow-up record. |
| Staff Conversion Rate | Enrolments linked to leads assigned to staff. |
| Duplicate Lead Rate | Potential duplicate leads detected across campaigns. |
| Manual Merge Queue | Leads requiring human review. |

### 8.5 Strategic KPI Metrics

| KPI Area | Measurement |
|---|---|
| International Student Intake | Enrolled students by country, faculty, and programme. |
| MoU / MoA | Agreements signed or initiated by campaign or non-campaign activity. |
| Student Mobility | Inbound and outbound mobility count. |
| Academic Peers | Academic contacts and QS/reputation peer records. |
| Executive Programme Income | Income generated from executive training programmes. |
| International Visibility | Countries, institutions, and campaigns engaged. |

---

## 9. ROI Rules and Assumptions

To prevent misleading ROI results, iLead should allow management to choose the revenue basis.

### 9.1 Revenue Basis

| Option | Description |
|---|---|
| First-Year Revenue | Uses only the first year of tuition. Conservative and easier to verify. |
| Full-Programme Revenue | Uses expected tuition across the full programme duration. Suitable for long-term ROI. |
| Net Revenue | Gross tuition minus scholarships, fee waivers, or discounts. Recommended for management reporting. |

### 9.2 Scholarship Handling

Scholarships should not be ignored. Each enrolment record should indicate whether the student is:

- self-funded;
- sponsored;
- partial scholarship;
- full scholarship;
- fee waiver;
- exchange or mobility only.

ROI should be reported using **net tuition revenue** where possible.

### 9.3 Currency Handling

Campaign spending may occur in MYR, IDR, USD, EUR, JPY, or other currencies. iLead should store:

- original amount;
- original currency;
- FX rate to MYR;
- MYR equivalent;
- FX rate source and date.

This prevents inaccurate budget comparison across countries.

---

## 10. Dashboard Views

### 10.1 Executive Dashboard

Shows:

- Total campaign spend in MYR.
- Total leads, applications, offers, and enrolments.
- Cost per enrolled student.
- First-year and full-programme ROI.
- ROI by country.
- ROI by faculty.
- ROI by programme.
- Best and worst performing campaigns.
- Strategic KPI progress.

### 10.2 Faculty Dean Dashboard

Shows:

- Leads and enrolments linked to the faculty.
- Faculty share in CIAC umbrella campaigns.
- Programme-level conversion.
- Campaigns involving the faculty through CampaignFaculty and CampaignProgramme mapping.

### 10.3 Operational Dashboard

Shows:

- Assigned leads.
- New leads older than SLA.
- Overdue follow-ups.
- Duplicate lead alerts.
- Manual merge queue.
- Follow-up status by staff.

### 10.4 Campaign Detail Report

Shows:

- Campaign profile.
- Countries, faculties, and programmes involved.
- Budget and spending by currency.
- Lead funnel.
- Application and enrolment outcomes.
- ROI based on selected revenue basis.
- MoU/MoA, mobility, academic peers, and executive programme outcomes.

---

## 11. Recommended Budget

### 11.1 Research Grant Prototype Budget: RM30,000

| Item | Estimated Cost |
|---|---:|
| Research Assistant | RM2,000 |
| Hosting, domain, SSL, backup tools | RM4,000 |
| Requirement study and stakeholder interviews | RM2,000 |
| UI/UX design and prototype | RM2,000 |
| Database design and master data setup | RM2,000 |
| Backend development | RM4,000 |
| Frontend dashboard development | RM4,000 |
| CSV/Excel upload and validation | RM1,500 |
| Matching and deduplication module | RM2,000 |
| ROI engine and campaign metrics table | RM2,000 |
| Testing, documentation, and training | RM2,000 |
| Contingency | RM2,500 |
| **Total** | **RM30,000** |

### 11.2 Production-Ready Recommended Budget: RM35,000 to RM45,000

The full V1 scope is quite large. If UUM expects stronger security, UAT, reports, role-based dashboards, SSO readiness, backup testing, and proper data governance, a more realistic production budget is **RM35,000 to RM45,000**.

---

## 12. Implementation Timeline

| Phase | Duration | Activities | Output |
|---|---:|---|---|
| Phase 1 | Weeks 1-2 | Requirements, stakeholder interviews, data audit, master data confirmation | Requirement Document |
| Phase 2 | Weeks 3-4 | UI wireframes, database schema, API specification | Design Document |
| Phase 3 | Weeks 5-8 | Campaign, lead, follow-up, master data, and upload modules | MVP Core Modules |
| Phase 4 | Weeks 9-11 | Matching, deduplication, ROI engine, campaign metrics table | Analytics Engine |
| Phase 5 | Weeks 12-14 | Dashboards, reports, role-based access, UAT | Version 1 Prototype |
| Phase 6 | Weeks 15-18 | Refinement, training, documentation, deployment hardening | Production Candidate |

For a strict RM30,000 budget, scope should be controlled to a research prototype rather than a full enterprise production system.

---

## 13. Governance, Privacy, and Hosting

Because iLead stores student personal data such as name, email, phone, passport number, programme interest, and recruitment notes, the system must follow PDPA-aware governance.

Key requirements:

- Prefer UUM internal hosting or approved cloud hosting.
- Confirm data residency requirements before using an external VPS.
- Use HTTPS only.
- Use role-based access control.
- Store audit logs for sensitive actions.
- Apply soft delete instead of hard delete.
- Define backup retention, e.g. daily backup retained for 30 days and monthly backup retained for 12 months.
- Perform at least one restore drill before production launch.
- Display all times in Malaysia Time (MYT / UTC+8), while storing database timestamps in UTC.

---

## 14. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Staff do not enter leads | Incomplete data | Use simple mobile form and QR-based event lead capture. |
| Duplicate leads across campaigns | Inflated metrics | Add deduplication, merge workflow, and duplicate reporting. |
| Free-text country/programme values | Broken aggregation | Use Country, Programme, and Faculty master tables. |
| SIS integration delay | Matching cannot be automated | Start with CSV upload template, integrate SIS later. |
| Scholarship ignored in ROI | ROI overstated | Use net tuition revenue and scholarship fields. |
| Dashboard slow with large data | Poor user experience | Use campaign_metrics summary table and indexes. |
| External hosting privacy issue | Compliance risk | Confirm UUM hosting policy and PDPA requirements. |
| Scope too large for RM30,000 | Delivery delay | Prioritise MVP and push advanced features to Version 2. |

---

## 15. Expected Outputs

1. iLead web-based dashboard prototype.
2. Campaign and master data management module.
3. Lead capture and follow-up module.
4. CSV/Excel upload template.
5. Lead matching and deduplication workflow.
6. ROI calculation engine.
7. Campaign metrics summary table.
8. Executive dashboard.
9. Faculty dashboard.
10. Operational follow-up dashboard.
11. Exportable reports.
12. Data governance and user guide.

---

## 16. Conclusion

iLead will help UUM move from activity-based internationalisation reporting to outcome-based recruitment performance management. It allows the university to measure whether international campaigns actually generate leads, applications, offers, enrolments, tuition revenue, and strategic value.

The strongest value of iLead is that it connects budget spending with measurable recruitment outcomes. This allows UUM to make better decisions on which countries, faculties, programmes, and activities deserve continued investment.
