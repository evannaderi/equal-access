const isLocal = process.env.IS_LOCAL;
const chromium = require('@sparticuz/chromium');
const puppeteer = isLocal ? require('puppeteer') : require('puppeteer-core');
const path = require('path');
const fs = require('fs');

exports.handler = async (event) => {
  let browser;
  let htmlArray;
  chromium.setHeadlessMode = true;
  console.log("Chromium configuration:", chromium);
  console.log(`Is it local? ${isLocal}`);
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    browser = await puppeteer.launch({
      args: isLocal ? puppeteer.defaultArgs() : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: isLocal ? puppeteer.executablePath() : await chromium.executablePath(),
      headless: isLocal ? false : chromium.headless,
    });

    // Parse the input, handling both direct invocation and API Gateway cases
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        htmlArray = body.html;
      } catch (error) {
        console.error("Error parsing event body:", error);
      }
    } else if (event.html) {
      htmlArray = event.html;
    }

    console.log("Parsed htmlArray:", JSON.stringify(htmlArray, null, 2));
    console.log("htmlArray type:", typeof htmlArray);
    console.log("Is array?", Array.isArray(htmlArray));

    if (!htmlArray) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No HTML content provided" })
      };
    }

    if (!Array.isArray(htmlArray)) {
      if (typeof htmlArray === 'string') {
        htmlArray = [htmlArray];
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Input must be an array of HTML strings or a single HTML string",
            received: htmlArray,
            type: typeof htmlArray
          })
        };
      }
    }

    const reports = [];
    for (const htmlContent of htmlArray) {
      const page = await browser.newPage();
      console.log("Successfully created new page");
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
      reports.push(report);
      await page.close();
    }

    const filePath = isLocal ? 'report.txt' : '/tmp/report.txt';
    fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
    console.log(`Report written successfully to ${filePath}`);

    return {
      statusCode: 200,
      body: JSON.stringify(reports, null, 2)
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
