require("dotenv").config();

const express = require("express");
const cors = require("cors");

// --------------------------------------------------
// Environment validation
// --------------------------------------------------

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing from backend/.env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing from backend/.env");
  process.exit(1);
}

// --------------------------------------------------
// App
// --------------------------------------------------

const app = express();

const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://leave-management-system-ten-bay.vercel.app",
  "https://leave-management-system-git-main-abdul-rehman-7c13.vercel.app",
  "https://leave-management-system-8ryo3k6yk-abdul-rehman-7c13.vercel.app",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(
    process.env.FRONTEND_URL.replace(/\/$/, "")
  );
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no Origin header
      // (Postman, curl, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);

      return callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: true,
  })
);

app.use(express.json());

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LeaveFlow backend is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
  });
});

// --------------------------------------------------
// Routes
// --------------------------------------------------

const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const leaveTypesRouter = require("./routes/leaveTypes");
const leaveRequestsRouter = require("./routes/leaveRequests");
const adminRouter = require("./routes/admin");
const calendarRouter = require("./routes/calendar");
const leaveBalancesRouter = require("./routes/leaveBalances");

// Authentication
app.use("/api/auth", authRouter);

// Users
app.use("/api/users", usersRouter);

// Leave types
app.use("/api/leave-types", leaveTypesRouter);

// Leave requests
app.use("/api/leave-requests", leaveRequestsRouter);

// Admin
app.use("/api/admin", adminRouter);

// Calendar
app.use("/api/calendar", calendarRouter);

// Leave balances
app.use("/api/leave-balances", leaveBalancesRouter);

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --------------------------------------------------
// Global error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("=================================");
  console.error("SERVER ERROR");
  console.error(err);
  console.error("=================================");

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS blocked this request",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 LeaveFlow backend running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log("=================================");
});