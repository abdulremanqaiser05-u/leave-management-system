const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

// =========================================================
// HELPERS
// =========================================================

const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const difference =
    end.getTime() - start.getTime();

  if (difference < 0) {
    return 0;
  }

  return (
    Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ) + 1
  );
};

// =========================================================
// GET CURRENT USER LEAVE BALANCE
// GET /api/leave-balances
// =========================================================

router.get(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);

      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({
          message: "Invalid user ID.",
        });
      }

      // -----------------------------------------------------
      // Get all leave types
      // -----------------------------------------------------

      const leaveTypes =
        await prisma.leaveType.findMany({
          orderBy: {
            id: "asc",
          },
        });

      // -----------------------------------------------------
      // Make sure this employee has a balance row
      // for every leave type.
      //
      // New employees automatically receive the default
      // allowance from LeaveType.totalDays.
      // -----------------------------------------------------

      for (const leaveType of leaveTypes) {
        await prisma.employeeLeaveBalance.upsert({
          where: {
            userId_leaveTypeId: {
              userId,
              leaveTypeId: leaveType.id,
            },
          },

          update: {},

          create: {
            userId,
            leaveTypeId: leaveType.id,
            entitlement: leaveType.totalDays,
          },
        });
      }

      // -----------------------------------------------------
      // Get employee-specific balances
      // -----------------------------------------------------

      const balances =
        await prisma.employeeLeaveBalance.findMany({
          where: {
            userId,
          },

          include: {
            leaveType: true,
          },

          orderBy: {
            leaveTypeId: "asc",
          },
        });

      // -----------------------------------------------------
      // Get approved + pending requests
      // -----------------------------------------------------

      const requests =
        await prisma.leaveRequest.findMany({
          where: {
            userId,

            status: {
              in: [
                "APPROVED",
                "PENDING",
              ],
            },
          },

          select: {
            leaveTypeId: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        });

      // -----------------------------------------------------
      // Calculate balance for each leave type
      // -----------------------------------------------------

      const result = balances.map(
        (balance) => {
          let used = 0;
          let pending = 0;

          requests
            .filter(
              (request) =>
                request.leaveTypeId ===
                balance.leaveTypeId
            )
            .forEach((request) => {
              const days = calculateDays(
                request.startDate,
                request.endDate
              );

              if (
                request.status ===
                "APPROVED"
              ) {
                used += days;
              }

              if (
                request.status ===
                "PENDING"
              ) {
                pending += days;
              }
            });

          const entitlement =
            Number(balance.entitlement) || 0;

          const remaining = Math.max(
            entitlement -
              used -
              pending,
            0
          );

          return {
            id: balance.id,

            leaveTypeId:
              balance.leaveTypeId,

            name:
              balance.leaveType.name,

            entitlement,

            used,

            pending,

            remaining,
          };
        }
      );

      // -----------------------------------------------------
      // Overall totals
      // -----------------------------------------------------

      const totals = result.reduce(
        (total, balance) => {
          total.entitlement +=
            balance.entitlement;

          total.used += balance.used;

          total.pending +=
            balance.pending;

          total.remaining +=
            balance.remaining;

          return total;
        },
        {
          entitlement: 0,
          used: 0,
          pending: 0,
          remaining: 0,
        }
      );

      res.status(200).json({
        balances: result,
        totals,
      });
    } catch (error) {
      console.error(
        "Failed to fetch leave balances:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch leave balances",
      });
    }
  }
);

module.exports = router;