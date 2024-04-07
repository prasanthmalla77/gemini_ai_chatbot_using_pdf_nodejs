// netlify-functions/chatbot.js
const { run } = require('./main.js');

exports.handler = async (event, context) => {
    const { question } = JSON.parse(event.body);
    console.log(question);
    const answer = await run(question);
    return {
        statusCode: 200,
        body: JSON.stringify({ message: answer }),
    };
};
