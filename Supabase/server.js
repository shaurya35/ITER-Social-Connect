require("dotenv").config();
const express = require("express");
const uploadRoutes = require("./routes/uploadRoutes");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", uploadRoutes);

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.send("Welcome to Supabase");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
