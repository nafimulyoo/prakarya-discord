require('dotenv').config(); // Load environment variables from .env file
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// Get your Discord bot token from environment variables
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
// The URL of your FastAPI application's /ask endpoint
const FASTAPI_APP_URL = "https://candy-be-565090697965.us-central1.run.app/chat/ask-stream";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Crucial for reading message content
    ]
});

client.once('ready', () => {
    console.log(`Bot connected as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    // Ignore messages from the bot itself to prevent infinite loops
    if (message.author.bot) return;

    console.log(`Message from ${message.author.tag}: ${message.content}`);

    // You can add a prefix for bot commands if you wish, e.g., only respond to messages starting with "!"
    // if (!message.content.startsWith('!')) return;
    // const command = message.content.slice(1).trim(); // Remove the prefix

    try {
        const payload = {
            name: message.author.username, // Or display name
            message: message.content,
            session_id: `discord-${message.channel.id}-${message.author.id}` // Unique session per user per channel
        };

        // Send the message directly to your FastAPI application
        const response = await axios.post(FASTAPI_APP_URL, payload);

        const fastapiResponse = response.data;
        console.log("Response from FastAPI:", fastapiResponse);

        if (fastapiResponse && fastapiResponse.response) {
            await message.reply(fastapiResponse.response);
        } else {
            await message.reply("Received an empty or unexpected response from the AI service.");
        }

    } catch (error) {
        console.error("Error communicating with FastAPI:", error.response ? error.response.data : error.message);
        let errorMessage = "Apologies, I'm having trouble connecting to my AI service.";
        if (error.response && error.response.data && error.response.data.detail) {
            errorMessage += ` Details: ${error.response.data.detail}`;
        } else if (error.message) {
            errorMessage += ` Details: ${error.message}`;
        }
        await message.reply(errorMessage);
    }
});

if (!DISCORD_BOT_TOKEN) {
    console.error("Error: DISCORD_BOT_TOKEN environment variable not set.");
    console.error("Please set the DISCORD_BOT_TOKEN to your bot's token in a .env file or as an environment variable.");
    process.exit(1);
}

client.login(DISCORD_BOT_TOKEN);