const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { checkAccessibility } = require('./accessibilityChecker');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/check', async (req, res) => {
  console.log('in server');
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    });

    let htmlArray = req.body.html;
    if (!htmlArray) {
      return res.status(400).json({ error: "No HTML content provided" });
    }
    if (!Array.isArray(htmlArray)) {
      if (typeof htmlArray === 'string') {
        htmlArray = [htmlArray];
      } else {
        return res.status(400).json({
          error: "Input must be an array of HTML strings or a single HTML string",
          received: htmlArray,
          type: typeof htmlArray
        });
      }
    }

    const reports = [];
    for (const htmlContent of htmlArray) {
      const report = await checkAccessibility(browser, htmlContent);
      reports.push(report);
    }

    fs.writeFileSync('report.txt', JSON.stringify(reports, null, 2));
    console.log('Report written successfully to report.txt');

    res.json(reports);
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.post('/log', async (req, res) => {
	const message = req.body;
	console.log(message);

	res.json()
})

app.listen(port, () => {
  console.log(`Accessibility checker listening at http://localhost:${port}`);
});
