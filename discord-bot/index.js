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
app.use(express.json());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const CHANNEL_IDS = [
  "1322701242509693070", //1
  "1322701265163259935", //2
  "1322701281793675435", //3
  "1322701996989354016", //4
  "1322702013724758109", //5
  "1322702031529705542", //6
  "1322702987596140544", //7
  "1322703008022270153", //8
  "1322703021280460883", //9
  "1322703036866625597", //10
  "1322703053803098215", //11
  "1322703066457178206", //12
  "1322703107309961347", //13
  "1322703461006966895", //14
  "1322703529546088569", //15
];
let channelIndex = 0;

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

  const filePath = req.file.path;
  console.log(`Uploaded file details:`, req.file);

  try {
    console.log("Fetching the guild...");
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log("Guild fetched successfully:", guild.name);

    // round-robin
    const selectedChannelId = CHANNEL_IDS[channelIndex];
    channelIndex = (channelIndex + 1) % CHANNEL_IDS.length;

    console.log(`Using channel ID: ${selectedChannelId}`);
    const channel = await guild.channels.fetch(selectedChannelId);

    if (!channel) {
      throw new Error(`Channel with ID ${selectedChannelId} not found`);
    }

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

    res.status(200).json({ imageUrl });
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
