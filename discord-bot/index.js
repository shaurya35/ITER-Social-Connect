const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
require("dotenv").config();
const cors = require("cors");

const app = express();
const upload = multer({ dest: "uploads/" });
const allowedOrigins = [
  "http://localhost:3000",
  "http://itersocialconnect.vercel.app",
  "https://itersocialconnect.vercel.app",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CATEGORY_ID = process.env.CATEGORY_ID;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});
client.login(BOT_TOKEN);

app.get("/test", (req, res) => {
  console.log("Received a GET request to /test");
  res
    .status(200)
    .json({ message: "Server is running and ready to receive requests!" });
});

app.post("/upload", upload.single("photo"), async (req, res) => {
  console.log("Received a request to /upload");

  if (!req.file) {
    console.error("No file uploaded!");
    return res.status(400).json({ error: "No file uploaded!" });
  }

  const { username } = req.body;
  const filePath = req.file.path;
  console.log(`Username: ${username}`);
  console.log(`Uploaded file details:`, req.file);

  try {
    console.log("Fetching the guild...");
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log("Guild fetched successfully:", guild.name);

    console.log(`Creating a channel for user: ${username}`);
    const channel = await guild.channels.create({
      name: `profile-${username}`,
      type: 0,
      parent: CATEGORY_ID,
    });
    console.log(`Channel created successfully: ${channel.name}`);

    console.log("Waiting for the channel to be fully created...");
    await sleep(2000);

    console.log("Uploading the photo to the channel...");
    const attachment = new AttachmentBuilder(filePath);
    const message = await channel.send({ files: [attachment] });
    console.log("Photo uploaded to the channel.");

    console.log("Waiting for Discord to propagate the file...");
    await sleep(3000);

    const attachmentDetails = message.attachments.first();
    if (!attachmentDetails) {
      throw new Error("No attachment found in the message.");
    }
    console.log("Attachment details:", attachmentDetails);

    let imageUrl = attachmentDetails.url;
    console.log("Raw CDN URL:", imageUrl);

    imageUrl = imageUrl.replace(/^https:\/\/cdn\./, "https://");
    imageUrl = imageUrl.replace(/discordapp\.com/, "media.discordapp.net");
    imageUrl += "?format=jpeg&width=460&height=465";

    console.log("Final usable image URL:", imageUrl);

    fs.unlinkSync(filePath);
    console.log("Temporary file deleted:", filePath);

    res.status(200).json({ username, imageUrl });
  } catch (error) {
    console.error("Error uploading photo:", error);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Temporary file cleaned up after error:", filePath);
    }

    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// Start the server
app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
