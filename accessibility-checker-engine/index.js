const isLocal = process.env.IS_LOCAL;
const chromium = require('@sparticuz/chromium');
const puppeteer = isLocal ? require('puppeteer') : require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { checkAccessibility } = require('./accessibilityChecker');

exports.handler = async (event) => {
  let browser;
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

  let htmlArray;
  if (event.body) {
    htmlArray = typeof event.body === "string" ? JSON.parse(event.body).html : event.body.html;
  } else {
    htmlArray = event.html;
  }
    
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
      const report = await checkAccessibility(browser, htmlContent);
      reports.push(report);
    }

    const filePath = isLocal ? 'report.txt' : '/tmp/report.txt';
    console.log(`Report written successfully to ${filePath}`);

    let responseBody = "";
    for (const report of reports) {
      responseBody += JSON.stringify(report, null, 2);
    }

    return {
      statusCode: 200,
      body: responseBody
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
