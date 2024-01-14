const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');

async function run() {
  const browser = await puppeteer.launch({ headless: false, timeout: 120000 });
  let page_num = 200;
  let jobData = [];
  while (true){
  const page = await browser.newPage();
  
  await page.goto(`https://wuzzuf.net/search/jobs/?a=hpb&q=software&start=${page_num}`);

  const page_limit = await page.evaluate(() => {
    const strongElement = document.querySelector('strong');
    return strongElement ? strongElement.textContent.trim() : 'Not found';
  });
  console.log(page_limit)
 const page_limit_int = parseInt(page_limit, 10);
  total_pages =  Math.ceil(page_limit_int / 15);

var limitWithoutCommas = page_limit.replace(/,/g, '');
 var page_limit_int = parseInt(limitWithoutCommas, 10);
  console.log("Total Jobs:", page_limit_int);
  const total_pages = Math.ceil(page_limit_int / 15);
  console.log("Total Pages:", total_pages);

  if(page_num > total_pages){
    console.log("pages done");
    break;
  }

  
    await page.waitForSelector('.css-1gatmva.e1v1l3u10');
    const currentPageData = await page.evaluate(() => {
      const jobDivs = document.querySelectorAll('.css-1gatmva.e1v1l3u10');

      const jobs = [];

      jobDivs.forEach((jobDiv) => {
        const jobTitle = jobDiv.querySelector('h2.css-m604qf').textContent.trim();
        const companyText = jobDiv.querySelector('a.css-17s97q8').textContent.trim();
        const location = jobDiv.querySelector('span.css-5wys0k').textContent.trim();
        const company = companyText.replace(/-$/, '').trim();
        const link = jobDiv.querySelector('h2.css-m604qf a').getAttribute('href');

        jobs.push({ jobTitle, company, location, link, skills: '', exp: '', requirements: '' });
      });

      return jobs;
    });
    
    for (const job of currentPageData) {
      await page.goto(job.link, { timeout: 120000 });

      await page.waitForSelector('.css-s2o0yh', { timeout: 120000 });

      const jobSkills = await page.evaluate(() => {
        const skillsDiv = document.querySelector('.css-s2o0yh');
        if (skillsDiv) {
          const skillElemnents = skillsDiv.querySelectorAll('a.css-g65o95');
          const skills = Array.from(skillElemnents).map((skillElemnent) => {
            const skillName = skillElemnent.querySelector("span.css-158icaa");
            return skillName ? skillName.textContent.trim() : "";
          });
          return skills.join('| ');

        }
        return 'Skills not found';
      });
      job.skills = jobSkills;

      const experience = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('.css-wn0avc'));
        for (const label of labels) {
          if (label.textContent.trim() === 'Experience Needed:') {
            const experienceElement = label.nextElementSibling.querySelector('.css-4xky9y');
            if (experienceElement) {
              return experienceElement.textContent.trim();
            }
          }
        }
        return 'Experience not found';
      });
      job.exp = experience;

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      try {
        await page.waitForSelector('div.css-1t5f0fr ul', { timeout: 120000 });
        const jobRequirements = await page.evaluate(() => {
          const requirementsList = document.querySelector('div.css-1t5f0fr ul');
          if (requirementsList) {
            const requirements = Array.from(requirementsList.querySelectorAll('li'))
              .map((li) => li.textContent.trim());
            return requirements;
          }
          return [];
        });
        job.requirements = jobRequirements.length > 0 ? jobRequirements : ['No requirements found'];
      } catch (error) {
        job.requirements = ['No requirements found'];

      }
    }

    jobData = jobData.concat(currentPageData);
    page_num += 1;
}
 

  console.log(jobData);

  saveToCSV(jobData);
  await browser.close();
}

const csvWriter = createObjectCsvWriter({
  path: 'F:\\shithole\\4th year-1st semester\\Graduation project\\dataScrappingjob_data.csv',
  header: [
    { id: 'jobTitle', title: 'Job Title' },
    { id: 'company', title: 'Company' },
    { id: 'location', title: 'Location' },
    { id: 'link', title: 'Link' },
    { id: 'skills', title: 'Skills' },
    { id: 'exp', title: 'Experience' },
    { id: 'requirements', title: 'Requirements' },
  ],
  append: true,
});

async function saveToCSV(jobData) {
  await csvWriter.writeRecords(jobData)
    .then(() => console.log('CSV file has been written.'));
}

run();
