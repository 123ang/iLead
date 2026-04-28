import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const date = (value) => new Date(value);

const countries = [
  { name: "Indonesia", iso2: "ID", iso3: "IDN", region: "Southeast Asia" },
  { name: "China", iso2: "CN", iso3: "CHN", region: "East Asia" },
  { name: "Vietnam", iso2: "VN", iso3: "VNM", region: "Southeast Asia" },
  { name: "Bangladesh", iso2: "BD", iso3: "BGD", region: "South Asia" },
  { name: "Thailand", iso2: "TH", iso3: "THA", region: "Southeast Asia" },
  { name: "Pakistan", iso2: "PK", iso3: "PAK", region: "South Asia" },
  { name: "Nigeria", iso2: "NG", iso3: "NGA", region: "West Africa" },
  { name: "India", iso2: "IN", iso3: "IND", region: "South Asia" },
];

const faculties = [
  { code: "SOC", name: "School of Computing" },
  { code: "OYAGSB", name: "Othman Yeop Abdullah Graduate School of Business" },
  { code: "COB", name: "College of Business" },
  { code: "COLGIS", name: "College of Law, Government and International Studies" },
  { code: "SBM", name: "School of Business Management" },
];

const programmes = [
  ["SOC", "BSC-CS", "BSc Computer Science", "BACHELOR", 4],
  ["SOC", "BSC-DS", "BSc Data Science", "BACHELOR", 4],
  ["SOC", "MSC-AI", "MSc Artificial Intelligence", "MASTER", 1.5],
  ["SOC", "MSC-CYBER", "MSc Cyber Security", "MASTER", 1.5],
  ["SOC", "PHD-COMP", "PhD Computing", "PHD", 3],
  ["OYAGSB", "MBA-INTL", "MBA International Business", "MASTER", 1.5],
  ["OYAGSB", "MBA-DIGI", "MBA Digital Transformation", "MASTER", 1.5],
  ["OYAGSB", "DBA-EXEC", "Doctor of Business Administration", "PHD", 3],
  ["OYAGSB", "EXEC-LDR", "Executive Leadership Certificate", "EXECUTIVE", 1],
  ["OYAGSB", "MSC-FIN", "MSc Finance", "MASTER", 1.5],
  ["COB", "BBA-MKT", "BBA Marketing", "BACHELOR", 4],
  ["COB", "BBA-FIN", "BBA Finance", "BACHELOR", 4],
  ["COB", "MSC-ECON", "MSc Economics", "MASTER", 1.5],
  ["COB", "PHD-BIZ", "PhD Business", "PHD", 3],
  ["COB", "BSC-ACC", "BSc Accounting", "BACHELOR", 4],
  ["COLGIS", "BA-IR", "BA International Relations", "BACHELOR", 4],
  ["COLGIS", "BA-PA", "BA Public Administration", "BACHELOR", 4],
  ["COLGIS", "LLM-INTL", "LLM International Law", "MASTER", 1.5],
  ["COLGIS", "PHD-GOV", "PhD Governance", "PHD", 3],
  ["COLGIS", "MSC-DEV", "MSc Development Studies", "MASTER", 1.5],
  ["SBM", "BBA-HRM", "BBA Human Resource Management", "BACHELOR", 4],
  ["SBM", "BBA-ENT", "BBA Entrepreneurship", "BACHELOR", 4],
  ["SBM", "MSC-HRM", "MSc Human Resource Management", "MASTER", 1.5],
  ["SBM", "EXEC-SALES", "Executive Sales Leadership", "EXECUTIVE", 1],
  ["SBM", "PHD-MGMT", "PhD Management", "PHD", 3],
];

const campaignBlueprints = [
  ["ASEAN Umbrella Fair", "CIAC_UMBRELLA", "2025-01-10", "2025-01-14", [0, 2, 4], [0, 2, 4]],
  ["Jakarta Graduate Roadshow", "ROADSHOW", "2025-02-06", "2025-02-08", [0], [1, 3]],
  ["Beijing Agent Roundtable", "AGENT_EVENT", "2025-03-03", "2025-03-05", [1], [0, 1]],
  ["Hanoi Computing Showcase", "EDUCATION_FAIR", "2025-04-15", "2025-04-18", [2], [0]],
  ["Dhaka Business Mobility Week", "CIAC_UMBRELLA", "2025-05-07", "2025-05-11", [3], [2, 4]],
  ["Bangkok Law and Policy Visit", "UNIVERSITY_VISIT", "2025-06-09", "2025-06-12", [4], [3]],
  ["Karachi Digital Campaign", "DIGITAL_CAMPAIGN", "2025-07-01", "2025-07-28", [5], [1, 2]],
  ["Lagos Executive Outreach", "CONFERENCE", "2025-08-17", "2025-08-20", [6], [1, 4]],
  ["Delhi Postgraduate Fair", "EDUCATION_FAIR", "2025-09-10", "2025-09-13", [7], [0, 2]],
  ["Global CIAC Strategic Tour", "CIAC_UMBRELLA", "2025-10-05", "2025-10-12", [1, 6, 7], [0, 1, 2, 3, 4]],
];

const defaultSettings = [
  ["sla.hot.days", 1],
  ["sla.warm.days", 3],
  ["sla.cold.days", 7],
  ["sla.businessDaysOnly", false],
  ["faculty_dean.umbrella_visibility", "linked_only"],
  ["pii.export.allowed_roles", ["SUPER_ADMIN", "CIAC_ADMIN"]],
  ["pii.retention.years", 5],
  ["notifications.daily_digest_time_myt", "09:00"],
  ["notifications.weekly_summary_day", "MONDAY"],
  ["roi.default_basis", "FIRST_YEAR"],
  ["auth.access_token_minutes", 15],
  ["auth.refresh_token_days", 7],
  ["auth.login_rate_limit", { attempts: 5, windowMinutes: 5 }],
  ["metrics.refresh_cron", "0 2 * * *"],
];

async function resetDatabase() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.campaignMetric.deleteMany(),
    prisma.executiveProgrammeIncome.deleteMany(),
    prisma.academicPeer.deleteMany(),
    prisma.mobilityRecord.deleteMany(),
    prisma.mouMoa.deleteMany(),
    prisma.enrolment.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.applicationStatusHistory.deleteMany(),
    prisma.application.deleteMany(),
    prisma.followUp.deleteMany(),
    prisma.leadStatusHistory.deleteMany(),
    prisma.leadMergeCandidate.deleteMany(),
    prisma.leadCampaignTouch.deleteMany(),
    prisma.uploadBatchRow.deleteMany(),
    prisma.uploadBatch.deleteMany(),
    prisma.campaignCost.deleteMany(),
    prisma.campaignProgramme.deleteMany(),
    prisma.campaignFaculty.deleteMany(),
    prisma.campaignCountry.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.tuitionFee.deleteMany(),
    prisma.scholarship.deleteMany(),
    prisma.sponsor.deleteMany(),
    prisma.fxRate.deleteMany(),
    prisma.currency.deleteMany(),
    prisma.programme.deleteMany(),
    prisma.user.deleteMany(),
    prisma.faculty.deleteMany(),
    prisma.country.deleteMany(),
    prisma.systemSetting.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
  ]);
}

async function seedMasterData() {
  for (const [key, value] of defaultSettings) {
    await prisma.systemSetting.create({ data: { key, value } });
  }

  const facultyMap = new Map();
  for (const faculty of faculties) {
    const created = await prisma.faculty.create({ data: faculty });
    facultyMap.set(faculty.code, created);
  }

  const countryMap = new Map();
  for (const country of countries) {
    const created = await prisma.country.create({ data: country });
    countryMap.set(country.iso2, created);
  }

  const programmeMap = new Map();
  for (const [facultyCode, code, name, studyLevel, durationYears] of programmes) {
    const created = await prisma.programme.create({
      data: {
        code,
        name,
        facultyId: facultyMap.get(facultyCode).id,
        studyLevel,
        durationYears,
      },
    });
    programmeMap.set(code, created);
  }

  const currencies = await Promise.all(
    [
      ["MYR", "Malaysian Ringgit", "RM"],
      ["USD", "US Dollar", "$"],
      ["IDR", "Indonesian Rupiah", "Rp"],
      ["CNY", "Chinese Yuan", "¥"],
      ["EUR", "Euro", "€"],
    ].map(([code, name, symbol]) =>
      prisma.currency.create({ data: { code, name, symbol } }),
    ),
  );

  const currencyMap = new Map(currencies.map((currency) => [currency.code, currency]));
  const fxRates = {
    MYR: 1,
    USD: 4.72,
    IDR: 0.00029,
    CNY: 0.65,
    EUR: 5.06,
  };

  for (const month of [1, 2, 3, 4, 5, 6]) {
    for (const [code, rateToMyr] of Object.entries(fxRates)) {
      await prisma.fxRate.create({
        data: {
          currencyId: currencyMap.get(code).id,
          rateToMyr,
          rateDate: date(`2026-${String(month).padStart(2, "0")}-01T00:00:00.000Z`),
          source: "seeded_reference",
        },
      });
    }
  }

  const scholarshipRows = [
    {
      name: "UUM Merit Scholarship",
      type: "PARTIAL",
      discountPercent: 25,
      valueMyr: 0,
      isPercent: true,
    },
    {
      name: "ASEAN Tuition Waiver",
      type: "FEE_WAIVER",
      amountMyr: 6000,
      valueMyr: 6000,
      isPercent: false,
    },
    {
      name: "Strategic Partner Scholarship",
      type: "PARTIAL",
      amountMyr: 8000,
      valueMyr: 8000,
      isPercent: false,
    },
  ];
  for (const scholarship of scholarshipRows) {
    await prisma.scholarship.create({ data: scholarship });
  }

  const sponsors = [
    { name: "Self-funded", countryId: null },
    { name: "Indonesia Ministry Scholarship", countryId: countryMap.get("ID").id },
    { name: "Nigeria Education Trust", countryId: countryMap.get("NG").id },
  ];
  for (const sponsor of sponsors) {
    await prisma.sponsor.create({ data: sponsor });
  }

  const programmeRows = await prisma.programme.findMany();
  for (const programme of programmeRows) {
    const annualFee = programme.studyLevel === "PHD"
      ? 26000
      : programme.studyLevel === "MASTER"
        ? 22000
        : programme.studyLevel === "EXECUTIVE"
          ? 18000
          : 16000;
    await prisma.tuitionFee.create({
      data: {
        programmeId: programme.id,
        studyLevel: programme.studyLevel,
        amountMyr: annualFee,
        annualFeeMyr: annualFee,
        fullProgrammeFeeMyr: annualFee * Number(programme.durationYears),
        academicYear: "2026",
        effectiveFrom: date("2026-01-01T00:00:00.000Z"),
      },
    });
  }
  for (const programme of programmeRows.slice(0, 5)) {
    const base = programme.studyLevel === "PHD" ? 27000 : 17000;
    await prisma.tuitionFee.create({
      data: {
        programmeId: programme.id,
        studyLevel: programme.studyLevel,
        amountMyr: base,
        annualFeeMyr: base,
        fullProgrammeFeeMyr: base * Number(programme.durationYears),
        academicYear: "2027",
        effectiveFrom: date("2027-01-01T00:00:00.000Z"),
      },
    });
  }

  return { facultyMap, countryMap, programmeMap, currencyMap };
}

async function seedUsers({ facultyMap }) {
  const passwordHash = await bcrypt.hash("iLead2026!", 12);
  const rows = [
    ["SUPER_ADMIN", "Admin", "admin@ilead.local", null],
    ["MANAGEMENT", "Management One", "management1@ilead.local", null],
    ["MANAGEMENT", "Management Two", "management2@ilead.local", null],
    ["CIAC_ADMIN", "CIAC Admin One", "ciac1@ilead.local", null],
    ["CIAC_ADMIN", "CIAC Admin Two", "ciac2@ilead.local", null],
    ["CIAC_ADMIN", "CIAC Admin Three", "ciac3@ilead.local", null],
    ["FACULTY_DEAN", "Dean SOC", "dean-soc@ilead.local", facultyMap.get("SOC").id],
    ["FACULTY_DEAN", "Dean OYAGSB", "dean-oyagsb@ilead.local", facultyMap.get("OYAGSB").id],
    ["FACULTY_DEAN", "Dean COB", "dean-cob@ilead.local", facultyMap.get("COB").id],
    ["FACULTY_DEAN", "Dean COLGIS", "dean-colgis@ilead.local", facultyMap.get("COLGIS").id],
    ["FACULTY_DEAN", "Dean SBM", "dean-sbm@ilead.local", facultyMap.get("SBM").id],
    ...Array.from({ length: 10 }, (_, index) => [
      "STAFF",
      `Staff ${index + 1}`,
      `staff${index + 1}@ilead.local`,
      [...facultyMap.values()][index % faculties.length].id,
    ]),
    ["REGISTRAR", "Registrar", "registrar@ilead.local", null],
    ["FINANCE", "Finance", "finance@ilead.local", null],
  ];

  const users = [];
  for (const [role, name, email, facultyId] of rows) {
    users.push(
      await prisma.user.create({
        data: {
          role,
          name,
          email,
          facultyId,
          passwordHash,
        },
      }),
    );
  }
  return users;
}

function pickLeadStatus(index) {
  if (index % 5 === 0) return "NEW";
  if (index % 5 === 1) return "CONTACTED";
  return "INTERESTED";
}

async function seedCampaignsAndFunnel(context) {
  const { countryMap, programmeMap, facultyMap, currencyMap, users } = context;
  const staff = users.filter((user) => user.role === "STAFF");
  const scholarships = await prisma.scholarship.findMany();
  const sponsors = await prisma.sponsor.findMany();
  const programmeRows = await prisma.programme.findMany();
  const countryRows = await prisma.country.findMany();

  const allLeads = [];
  const campaigns = [];
  let globalLeadCounter = 0;

  for (let index = 0; index < campaignBlueprints.length; index += 1) {
    const [name, campaignType, startDate, endDate, countryIndexes, facultyIndexes] =
      campaignBlueprints[index];
    const relatedProgrammes = programmeRows.filter((programme) =>
      facultyIndexes.some(
        (facultyIndex) =>
          programme.facultyId === [...facultyMap.values()][facultyIndex].id,
      ),
    );

    const campaign = await prisma.campaign.create({
      data: {
        name,
        campaignType,
        startDate: date(`${startDate}T00:00:00.000Z`),
        endDate: date(`${endDate}T00:00:00.000Z`),
        objective: `Convert high-intent prospects from ${name}.`,
        status: "COMPLETED",
        approvedBudgetMyr: 40000 + index * 5000,
        countries: {
          create: countryIndexes.map((countryIndex) => ({
            countryId: countryRows[countryIndex].id,
          })),
        },
        faculties: {
          create: facultyIndexes.map((facultyIndex) => ({
            facultyId: [...facultyMap.values()][facultyIndex].id,
          })),
        },
        programmes: {
          create: relatedProgrammes.slice(0, 5).map((programme) => ({
            programmeId: programme.id,
          })),
        },
      },
    });

    campaigns.push(campaign);

    const costCurrency = index % 2 === 0 ? currencyMap.get("MYR") : currencyMap.get("USD");
    const fxRateToMyr = index % 2 === 0 ? 1 : 4.72;
    const originalAmount = index % 2 === 0 ? 26000 + index * 1200 : 6200 + index * 150;
    await prisma.campaignCost.create({
      data: {
        campaignId: campaign.id,
        currencyId: costCurrency.id,
        costType: index % 3 === 0 ? "MARKETING" : "TRAVEL",
        description: `Seeded ${campaign.name} operating cost`,
        amountOriginal: originalAmount,
        fxRateToMyr,
        amountMyr: originalAmount * fxRateToMyr,
        costDate: date(`${startDate}T00:00:00.000Z`),
      },
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { actualSpendMyr: originalAmount * fxRateToMyr },
    });

    const touchLeads = [];
    for (let touchIndex = 0; touchIndex < 50; touchIndex += 1) {
      let lead;
      if (index > 0 && touchIndex < 5) {
        lead = allLeads[(index * 11 + touchIndex) % allLeads.length];
      } else {
        const country = countryRows[countryIndexes[touchIndex % countryIndexes.length]];
        const programme = relatedProgrammes[touchIndex % relatedProgrammes.length];
        const staffUser = staff[(index + touchIndex) % staff.length];
        const finalStatus = pickLeadStatus(touchIndex);
        globalLeadCounter += 1;
        lead = await prisma.lead.create({
          data: {
            fullName: `Prospect ${globalLeadCounter} ${country.iso2}`,
            email: `prospect${globalLeadCounter}@example.local`,
            phone: `+6012${String(100000 + globalLeadCounter).slice(-6)}`,
            passportNumber: `P${String(100000 + globalLeadCounter)}`,
            externalLeadId: `EXT-${String(globalLeadCounter).padStart(4, "0")}`,
            countryId: country.id,
            interestedProgrammeId: programme.id,
            studyLevel: programme.studyLevel,
            leadQuality: touchIndex % 3 === 0 ? "HOT" : touchIndex % 3 === 1 ? "WARM" : "COLD",
            status: finalStatus,
            source: touchIndex % 4 === 0 ? "CSV_UPLOAD" : "EVENT_FORM",
            assignedStaffId: staffUser.id,
            assignedAt: date(`${startDate}T08:00:00.000Z`),
            notes: `Captured during ${campaign.name}.`,
          },
        });
        await prisma.leadStatusHistory.create({
          data: {
            leadId: lead.id,
            fromStatus: null,
            toStatus: finalStatus,
            changedById: staffUser.id,
            reason: "Seeded lead",
          },
        });
        allLeads.push(lead);
      }

      await prisma.leadCampaignTouch.upsert({
        where: {
          leadId_campaignId: {
            leadId: lead.id,
            campaignId: campaign.id,
          },
        },
        update: {},
        create: {
          leadId: lead.id,
          campaignId: campaign.id,
          source: touchIndex % 4 === 0 ? "CSV_UPLOAD" : "EVENT_FORM",
          sourceNote: `Touch ${touchIndex + 1}`,
        },
      });

      touchLeads.push(lead);

      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          staffId: lead.assignedStaffId,
          followUpType: touchIndex % 2 === 0 ? "WHATSAPP" : "EMAIL",
          followUpDate: date(`${startDate}T12:00:00.000Z`),
          nextFollowUpDate:
            touchIndex % 7 === 0
              ? date("2025-01-01T00:00:00.000Z")
              : date(`${endDate}T00:00:00.000Z`),
          outcome: touchIndex % 2 === 0 ? "Initial contact sent" : "Info pack shared",
        },
      });
    }

    const enrolledCount = index % 2 === 0 ? 5 : 4;
    for (let appIndex = 0; appIndex < 15; appIndex += 1) {
      const lead = touchLeads[appIndex];
      const programme = relatedProgrammes[appIndex % relatedProgrammes.length];
      const country = countryRows[countryIndexes[appIndex % countryIndexes.length]];
      const status =
        appIndex < enrolledCount
          ? "ENROLLED"
          : appIndex < 9
            ? "OFFERED"
            : appIndex < 12
              ? "UNDER_REVIEW"
              : "APPLIED";
      const tuitionRevenueMyr = programme.studyLevel === "PHD" ? 26000 : 22000;
      const scholarshipMyr = appIndex < 2 ? 5000 : 0;

      const application = await prisma.application.create({
        data: {
          leadId: lead.id,
          applicantName: lead.fullName,
          email: lead.email,
          phone: lead.phone,
          passportNumber: lead.passportNumber,
          countryId: country.id,
          programmeId: programme.id,
          studyLevel: programme.studyLevel,
          applicationStatus: status,
          applicationDate: date("2025-06-01T00:00:00.000Z"),
          offerDate: appIndex < 9 ? date("2025-07-01T00:00:00.000Z") : null,
          enrolmentDate:
            appIndex < enrolledCount ? date("2025-09-01T00:00:00.000Z") : null,
          sourceCampaignId: campaign.id,
          sourceRaw: campaign.name,
          scholarshipMyr,
          tuitionRevenueMyr,
        },
      });
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: status,
          changedById: users.find((user) => user.role === "REGISTRAR").id,
          reason: "Seeded application",
        },
      });

      if (appIndex < 9) {
        await prisma.offer.create({
          data: {
            applicationId: application.id,
            programmeId: programme.id,
            offerDate: date("2025-07-01T00:00:00.000Z"),
            status: appIndex < enrolledCount ? "ACCEPTED" : "ISSUED",
          },
        });
      }

      if (appIndex < enrolledCount) {
        const sponsor = appIndex % 5 === 0 ? sponsors[1 + (appIndex % 2)] : sponsors[0];
        const scholarship = appIndex % 5 === 0 ? scholarships[appIndex % scholarships.length] : null;
        const netTuition = tuitionRevenueMyr - scholarshipMyr;
        await prisma.enrolment.create({
          data: {
            applicationId: application.id,
            programmeId: programme.id,
            enrolmentDate: date("2025-09-01T00:00:00.000Z"),
            revenueType: scholarshipMyr > 0 ? "PARTIAL_SCHOLARSHIP" : "SELF_FUNDED",
            scholarshipId: scholarship?.id ?? null,
            sponsorId: sponsor?.id ?? null,
            grossTuitionMyr: tuitionRevenueMyr,
            scholarshipMyr,
            netTuitionMyr: netTuition,
            revenueBasis: appIndex % 3 === 0 ? "FULL_PROGRAMME" : "FIRST_YEAR",
            manualAttributionCampaignId: appIndex === 0 ? campaign.id : null,
          },
        });
      }
    }
  }

  return { campaigns, allLeads };
}

async function seedOutcomeTables({ campaigns, countryMap }) {
  for (let index = 0; index < 20; index += 1) {
    await prisma.mouMoa.create({
      data: {
        campaignId: campaigns[index % campaigns.length].id,
        institution: `Partner University ${index + 1}`,
        countryId: [...countryMap.values()][index % countries.length].id,
        type: index % 2 === 0 ? "MOU" : "MOA",
        status: index % 3 === 0 ? "SIGNED" : "IN_NEGOTIATION",
        signedDate: index % 3 === 0 ? date("2025-11-01T00:00:00.000Z") : null,
      },
    });
  }

  for (let index = 0; index < 15; index += 1) {
    await prisma.mobilityRecord.create({
      data: {
        campaignId: campaigns[index % campaigns.length].id,
        institution: `Mobility Partner ${index + 1}`,
        countryId: [...countryMap.values()][index % countries.length].id,
        studentCount: 6 + (index % 5),
        mobilityType: index % 2 === 0 ? "INBOUND" : "OUTBOUND",
      },
    });
  }

  for (let index = 0; index < 10; index += 1) {
    await prisma.academicPeer.create({
      data: {
        campaignId: campaigns[index % campaigns.length].id,
        name: `Academic Peer ${index + 1}`,
        institution: `Institution ${index + 1}`,
        countryId: [...countryMap.values()][index % countries.length].id,
        email: `peer${index + 1}@example.local`,
      },
    });
  }

  for (let index = 0; index < 5; index += 1) {
    await prisma.executiveProgrammeIncome.create({
      data: {
        campaignId: campaigns[index].id,
        programmeName: `Executive Programme ${index + 1}`,
        amountMyr: 15000 + index * 3500,
        incomeDate: date(
          `2025-${String(index + 1).padStart(2, "0")}-01T00:00:00.000Z`,
        ),
        description: "Seeded executive education income",
      },
    });
  }
}

async function main() {
  await resetDatabase();
  const master = await seedMasterData();
  const users = await seedUsers(master);
  const funnel = await seedCampaignsAndFunnel({ ...master, users });
  await seedOutcomeTables({ campaigns: funnel.campaigns, countryMap: master.countryMap });
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
