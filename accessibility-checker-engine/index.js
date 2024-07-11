const isLocal = process.env.IS_LOCAL;

const chromium = require('@sparticuz/chromium');
const puppeteer = isLocal ? require('puppeteer') : require('puppeteer-core');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

exports.handler = async (event) => {
  let browser;

  chromium.setHeadlessMode = true

  console.log(chromium)
  console.log(`Is it local? ${isLocal}`);

  try {

    browser = await puppeteer.launch({
      args: process.env.IS_LOCAL ? puppeteer.defaultArgs() : chromium.args, // https://github.com/puppeteer/puppeteer/issues/6258
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.IS_LOCAL
      ? puppeteer.executablePath()
      : await chromium.executablePath(),
      headless: process.env.IS_LOCAL ? false : chromium.headless,
    });

    const [page] = await browser.pages();

    console.log("Successfully got page")

    const htmlContent = event.html || `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <title>Test Document</title>
      </head>
      <body>
          <h1>Test Page</h1>
          <a href="#">Link with no description to test</a>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    await page.addScriptTag({ path: path.join(__dirname, 'dist/ace.js') });

    const report = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const checker = new ace.Checker();
        checker.check(document, ["IBM_Accessibility"])
          .then(function (report) {
            resolve(report);
          }).catch(function (error) {
            reject(error);
          });
      });
    });

    const filePath = isLocal ? 'report.txt' : '/tmp/report.txt';

    fs.writeFile(filePath, JSON.stringify(report, null, 2), (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log(`Report written successfully`);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(report, null, 2)
    };

  } catch (error) {
    console.error('An error occurred:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/*Test in lambda function with this:
{
  "html": "<!DOCTYPE html><html lang='en'><head><title>Test Document</title></head><body><h1>Test Page</h1><a href='#'>Link with no description to test</a></body></html>"
}
*/