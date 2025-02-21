const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
require("dotenv").config();
const cors = require("cors");

const app = express();

// Restore CORS configuration with allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://itersocialconnect.vercel.app",
  "https://itersocialconnect.vercel.app",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) 
      // or if the origin is in our allowed list.
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

// Configure multer to only accept images and store files temporarily in the "uploads" folder.
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

// Create a Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

// Define your Discord channel IDs for load balancing
const CHANNEL_IDS = [
  "1322701242509693070",
  "1322701265163259935",
  "1322701281793675435",
  "1322701996989354016",
  "1322702013724758109",
  "1322702031529705542",
  "1322702987596140544",
  "1322703008022270153",
  "1322703021280460883",
  "1322703036866625597",
  "1322703053803098215",
  "1322703066457178206",
  "1322703107309961347",
  "1322703461006966895",
  "1322703529546088569",
];
let channelIndex = 0;

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});
client.login(BOT_TOKEN);

// Endpoint to handle image upload
app.post("/upload", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const filePath = req.file.path;
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    // Use round-robin to pick a channel
    const selectedChannelId = CHANNEL_IDS[channelIndex];
    channelIndex = (channelIndex + 1) % CHANNEL_IDS.length;

    const channel = await guild.channels.fetch(selectedChannelId);
    if (!channel) throw new Error("Channel not found");

    // Pass the original filename so Discord recognizes the file type
    const attachment = new AttachmentBuilder(filePath, { name: req.file.originalname });
    const message = await channel.send({ files: [attachment] });
    const attachmentDetails = message.attachments.first();
    if (!attachmentDetails) throw new Error("Attachment not found");

    // Modify the URL to use the media subdomain and append query parameters for format, width, and height
    let imageUrl = attachmentDetails.url;
    imageUrl = imageUrl.replace(/^https:\/\/cdn\./, "https://");
    imageUrl = imageUrl.replace(/discordapp\.com/, "media.discordapp.net");
    imageUrl += "?format=jpeg&width=100&height=100";

    // Clean up the temporary file
    fs.unlinkSync(filePath);
    return res.status(200).json({ imageUrl });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Failed to upload photo" });
  }
});

// Start the server
app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
