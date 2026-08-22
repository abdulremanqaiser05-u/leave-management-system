require("dotenv").config();

const express = require("express");
const cors = require("cors");

const usersRouter = require("./routes/users");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// User API
app.use("/api/users", usersRouter);

// Home/test route
app.get("/", (req, res) => {
  res.json({
    message: "Leave Management System API is running",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});