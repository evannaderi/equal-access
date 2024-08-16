const axios = require('axios');
const fs = require('fs');

const fileContent = fs.readFileSync('test.html', 'utf8');
const escapedContent = JSON.stringify(fileContent);

const testHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Page</title>
</head>
<body>
    <h1>Welcome to the Accessibility Test Page</h1>
    <img src="example.jpg" alt=""> <!-- Intentional accessibility issue: missing alt text -->
    <a href="#">Click here</a> <!-- Intentional accessibility issue: non-descriptive link text -->
</body>
</html>
`;

async function testServer() {
    try {
        console.log('hi');
        const response = await axios.post('http://localhost:3000/check', {
            html: escapedContent
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // const log = await axios.post('http://localhost:3000/log', {
        //     html: escapedContent
        // }, {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });

        console.log('Server Response:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error testing server:', error.message);
        if (error.response) {
            console.error('Server responded with:', error.response.status, error.response.data);
        }
    }
}

testServer();
