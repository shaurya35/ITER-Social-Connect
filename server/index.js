require("dotenv").config();
const express = require("express");
const app = express();
const port = 3000;
const authRoutes = require("./routes/authRoutes");
const feedRoutes = require("./routes/feedRoutes");
const { isLoggedIn } = require("./middlewares/authMiddlewares");

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/", feedRoutes);

app.get("/", isLoggedIn, (req, res) => {
  res.send("Aaoge Tum Kabhi");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
