const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary upload directory

// Discord bot setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CATEGORY_ID = process.env.CATEGORY_ID;

// Login the bot
client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});
client.login(BOT_TOKEN);

// Test route to verify server functionality
app.get('/test', (req, res) => {
    console.log('Received a GET request to /test');
    res.status(200).json({ message: 'Server is running and ready to receive requests!' });
});

// Endpoint to upload the photo
app.post('/upload', upload.single('photo'), async (req, res) => {
    console.log('Received a request to /upload');
    console.log('Request body:', req.body); // Logs the incoming request body

    if (!req.file) {
        console.error('No file uploaded!');
        return res.status(400).json({ error: 'No file uploaded!' });
    }

    const { username } = req.body; // Username from request body
    const filePath = req.file.path; // Path of the uploaded file
    console.log(`Username: ${username}`);
    console.log(`Uploaded file path: ${filePath}`);

    try {
        console.log('Fetching the guild...');
        const guild = await client.guilds.fetch(GUILD_ID);
        console.log('Guild fetched successfully:', guild.name);

        console.log(`Creating a channel for user: ${username}`);
        const channel = await guild.channels.create({
            name: `profile-${username}`,
            type: 0, // Text channel
            parent: CATEGORY_ID, // Parent category
        });
        console.log(`Channel created successfully: ${channel.name}`);

        console.log('Uploading the photo to the channel...');
        const attachment = new AttachmentBuilder(filePath);
        const message = await channel.send({ files: [attachment] });
        console.log('Photo uploaded to the channel:', message.url);

        // Get the URL of the uploaded image
        const imageUrl = message.attachments.first().url;
        console.log('Image URL:', imageUrl);

        // Delete the temporary file
        fs.unlinkSync(filePath);
        console.log('Temporary file deleted:', filePath);

        // Respond with the image URL
        res.status(200).json({ username, imageUrl });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
