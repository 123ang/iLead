import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174';
const outDir = path.resolve('docs/user-manual-screenshots');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });

async function shot(name, label) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(900);
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`${name}\t${label}`);
}

async function clickNav(label) {
  await page.getByRole('link', { name: label }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
}

await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
await shot('01-login.png', 'Login screen');

await page.locator('input[type="email"]').fill('admin@ilead.local');
await page.locator('input[type="password"]').fill('iLead2026!');
await page.locator('button[type="submit"]').click();
await page.getByRole('button', { name: /logout/i }).waitFor({ timeout: 60000 });
await shot('02-dashboard.png', 'Executive dashboard with yearly graphs');

const navScreens = [
  ['Campaigns', '03-campaigns.png', 'Campaign management list'],
  ['Leads', '04-leads.png', 'Lead management list'],
  ['Applications', '05-application-upload.png', 'Application upload screen'],
  ['Follow-ups', '07-follow-ups.png', 'Follow-up overdue queue'],
  ['Duplicates', '08-duplicates.png', 'Duplicate leads review'],
  ['Reports', '09-reports.png', 'Management reports'],
  ['Master Data', '10-master-data.png', 'Master data administration'],
  ['Users', '11-users.png', 'User management'],
  ['Settings', '12-settings.png', 'System settings'],
  ['Audit Logs', '13-audit-logs.png', 'Audit logs'],
];

for (const [label, file, title] of navScreens) {
  await clickNav(label);
  await shot(file, title);
}

await clickNav('Applications');
const csvPath = path.join(outDir, 'sample-applications.csv');
fs.writeFileSync(
  csvPath,
  'applicantName,email,phone,passportNumber,country,programmeCode,studyLevel,applicationStatus,applicationDate,offerDate,enrolmentDate,sourceCampaign,scholarshipMyr,tuitionRevenueMyr\n' +
    'Sample Applicant,sample@example.com,,,,,BACHELOR,APPLIED,2026-04-29,,,,0,0\n',
  'utf8',
);
await page.locator('input[type="file"]').setInputFiles(csvPath);
await page.getByText(/Column mapping/i).waitFor({ timeout: 30000 });
await shot('06-application-upload-mapping.png', 'Application upload column mapping');

await browser.close();
