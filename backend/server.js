require("dotenv").config();

const express = require("express");
const cors = require("cors");

const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const leaveTypesRouter = require("./routes/leaveTypes");
const leaveRequestsRouter = require("./routes/leaveRequests");
const adminRouter = require("./routes/admin");
const calendarRouter = require("./routes/calendar");
const leaveBalanceRoutes = require("./routes/leaveBalances");

const app = express();
const PORT = 5000;

// =========================================
// MIDDLEWARE
// =========================================

app.use(cors());
app.use(express.json());

// =========================================
// API ROUTES
// =========================================

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/leave-types", leaveTypesRouter);
app.use("/api/leave-requests", leaveRequestsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/calendar", calendarRouter);
app.use(
  "/api/leave-balances",
  leaveBalanceRoutes
);

// =========================================
// HOME / TEST ROUTE
// =========================================

app.get("/", (req, res) => {
  res.json({
    message: "Leave Management System API is running",
  });
});

// =========================================
// START SERVER
// =========================================

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );
});