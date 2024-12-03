require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const authRoutes = require("./routes/authRoutes");

app.use(express.json());
app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.send("Aaoge Tum Kabhi");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
