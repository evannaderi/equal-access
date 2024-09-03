process.env.IS_LOCAL = true;
const { handler } = require('./index');
const fs = require('fs');

async function testLambda() {
  // Set environment variable to indicate local execution
  console.log(`Is it local? ${process.env.IS_LOCAL}`);

  let htmlContent = "";

  // Read the HTML file
  try {
    htmlContent = fs.readFileSync('test.html', 'utf-8');
    console.log("Read HTML content successfully.");
  } catch (error) {
    console.error("Error reading HTML file:", error.message);
    return;
  }

  // Prepare the test event with the HTML content
  const testEvent = {
    body: {
      html: [
        htmlContent
      ]
    }
  };

  // Invoke the handler
  try {
    console.log('Is it local in try?', process.env.IS_LOCAL);
    const result = await handler(testEvent);
    console.log('Lambda execution result:', result.body);
    console.log('Lambda execution result:', result.statusCode);
    console.log('Lambda execution result:', result.headers);
  } catch (error) {
    console.error('Lambda execution failed:', error);
  }
}

testLambda();

