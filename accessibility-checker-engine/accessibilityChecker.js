const path = require('path');
const fs = require('fs');

async function checkAccessibility(browser, htmlContent) {
  const page = await browser.newPage();
  console.log("Successfully created new page");
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: path.join(__dirname, 'dist/ace.js') });
  const report = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const ruleset = "WCAG_2_1";
      
      const checker = new ace.Checker();
      
      checker.check(document, [ruleset])
        .then(function (report) {
          // for (let idx=0; idx<report.results.length; ++idx) {
          //   if (report.results[idx].value[1] === "PASS") {
          //       report.results.splice(idx--,1);
          //   }
          // }

          resolve(report);
        }).catch(function (error) {
          reject(error);
        });
    });
  });
  await page.close();
  return report;
}

module.exports = { checkAccessibility };
