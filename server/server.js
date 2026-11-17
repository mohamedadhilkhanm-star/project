
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const dnsRoutes = require("./routes/dnsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("DNS Backend Running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend Connected!"
  });
});

// Original DNS routes
app.use("/api/dns", dnsRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Error:", error.message);
  });
