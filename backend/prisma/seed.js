import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
const d = (s) => new Date(s);
async function main() {
  const passwordHash = await bcrypt.hash('iLead2026!', 12);
  const settings = [
    ['sla.hot.days', 1], ['sla.warm.days', 3], ['sla.cold.days', 7], ['sla.businessDaysOnly', false],
    ['faculty_dean.umbrella_visibility', 'linked_only'], ['pii.export.allowed_roles', ['SUPER_ADMIN','CIAC_ADMIN']], ['pii.retention.years', 5]
  ];
  for (const [key,value] of settings) await prisma.systemSetting.upsert({ where:{key}, update:{value}, create:{key,value} });
  const faculties = await Promise.all(['SOC','OYAGSB','COB','COLGIS','SBM'].map(code => prisma.faculty.upsert({ where:{code}, update:{}, create:{code,name:{SOC:'School of Computing',OYAGSB:'Othman Yeop Abdullah Graduate School',COB:'College of Business',COLGIS:'College of Law, Government and International Studies',SBM:'School of Business Management'}[code]} })));
  const countries = await Promise.all(['Indonesia','China','Vietnam','Bangladesh','Thailand','Pakistan','Nigeria','India'].map((name,i)=>prisma.country.upsert({ where:{name}, update:{}, create:{name,iso2:['ID','CN','VN','BD','TH','PK','NG','IN'][i],region:i<5?'Asia':'Global South'} })));
  const currencies = await Promise.all([['MYR','Malaysian Ringgit','RM'],['USD','US Dollar','$'],['IDR','Indonesian Rupiah','Rp'],['CNY','Chinese Yuan','¥'],['EUR','Euro','€']].map(([code,name,symbol])=>prisma.currency.upsert({where:{code},update:{},create:{code,name,symbol}})));
  const programmes=[];
  for (const f of faculties) for (const [name,level] of [['BSc International Business','BACHELOR'],['MSc Management','MASTER'],['PhD Management','PHD'],['Executive Certificate','EXECUTIVE'],['MBA','MASTER']]) programmes.push(await prisma.programme.create({data:{name:`${name} (${f.code})`,code:`${f.code}-${name.split(' ')[0]}-${programmes.length}`,facultyId:f.id,studyLevel:level,durationYears:level==='PHD'?3:level==='BACHELOR'?4:1}}));
  for (const p of programmes.slice(0,30)) await prisma.tuitionFee.create({data:{programmeId:p.id,studyLevel:p.studyLevel,amountMyr:p.studyLevel==='PHD'?45000:p.studyLevel==='MASTER'?30000:20000,academicYear:'2026'}});
  const users = [
    ['Admin','admin@ilead.local','SUPER_ADMIN',null], ['CIAC Admin','ciac@ilead.local','CIAC_ADMIN',null], ['Registrar','registrar@ilead.local','REGISTRAR',null], ['Finance','finance@ilead.local','FINANCE',null], ['Staff One','staff@ilead.local','STAFF',faculties[0].id]
  ];
  for (const [name,email,role,facultyId] of users) await prisma.user.upsert({ where:{email}, update:{}, create:{name,email,role,facultyId,passwordHash,mustChangePassword:true} });
  const staff = await prisma.user.findUnique({where:{email:'staff@ilead.local'}});
  const myr = currencies.find(c=>c.code==='MYR');
  for (let i=0;i<5;i++) {
    const campaign = await prisma.campaign.create({data:{name:`${countries[i].name} Recruitment Campaign 202${i+1}`,campaignType:i===0?'CIAC_UMBRELLA':'EDUCATION_FAIR',startDate:d(`2025-0${i+1}-05`),endDate:d(`2025-0${i+1}-09`),status:'COMPLETED',approvedBudgetMyr:20000+i*5000,countries:{create:{countryId:countries[i].id}},faculties:{create:faculties.slice(0,i===0?3:1).map(f=>({facultyId:f.id}))},programmes:{create:programmes.slice(i*2,i*2+3).map(p=>({programmeId:p.id}))}}});
    await prisma.campaignCost.create({data:{campaignId:campaign.id,currencyId:myr.id,costType:'TRAVEL',description:'Flights, booth and allowance',amountOriginal:18000+i*3000,fxRateToMyr:1,amountMyr:18000+i*3000}});
    for (let j=0;j<12;j++) {
      const lead = await prisma.lead.create({data:{fullName:`Student ${i}-${j}`,email:`student${i}${j}@example.com`,countryId:countries[i].id,interestedProgrammeId:programmes[(i+j)%programmes.length].id,leadQuality:j%3===0?'HOT':j%3===1?'WARM':'COLD',status:j<5?'APPLIED':'CONTACTED',assignedStaffId:staff.id,touches:{create:{campaignId:campaign.id,source:j%2?'CSV_UPLOAD':'EVENT_FORM'}}}});
      if (j<5) await prisma.application.create({data:{leadId:lead.id,applicantName:lead.fullName,email:lead.email,countryId:countries[i].id,programmeId:programmes[(i+j)%programmes.length].id,studyLevel:programmes[(i+j)%programmes.length].studyLevel,applicationStatus:j<2?'ENROLLED':j<4?'OFFERED':'APPLIED',applicationDate:d('2025-06-01'),offerDate:j<4?d('2025-07-01'):null,enrolmentDate:j<2?d('2025-09-01'):null,tuitionRevenueMyr:j<2?30000:0,scholarshipMyr:j===1?5000:0}});
    }
  }
  await prisma.scholarship.createMany({data:[{name:'UUM International Scholarship',discountPercent:25},{name:'Dean Waiver',amountMyr:5000}],skipDuplicates:true});
  await prisma.sponsor.createMany({data:[{name:'Self-sponsored'},{name:'Government sponsor'}],skipDuplicates:true});
}
main().finally(()=>prisma.$disconnect());
