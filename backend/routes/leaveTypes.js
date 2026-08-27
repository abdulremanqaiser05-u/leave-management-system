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
// GET ALL LEAVE TYPES
// GET /api/leave-types
// =========================================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json(leaveTypes);
  } catch (error) {
    console.error(
      "Failed to fetch leave types:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch leave types",
    });
  }
});

// =========================================================
// GET MY INDIVIDUAL LEAVE BALANCES
// GET /api/leave-types/my-balances
// =========================================================

router.get(
  "/my-balances",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);

      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({
          message:
            "Invalid user ID in authentication token.",
        });
      }

      // -----------------------------------------
      // Get all leave types
      // -----------------------------------------

      const leaveTypes =
        await prisma.leaveType.findMany({
          orderBy: {
            id: "asc",
          },
        });

      // -----------------------------------------
      // Get this employee's custom balances
      // -----------------------------------------

      const employeeBalances =
        await prisma.employeeLeaveBalance.findMany({
          where: {
            userId,
          },

          include: {
            leaveType: true,
          },
        });

      // -----------------------------------------
      // Get approved + pending requests
      // -----------------------------------------

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

      // -----------------------------------------
      // Calculate days
      // -----------------------------------------

      const calculateDays = (
        startDate,
        endDate
      ) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const difference =
          end.getTime() -
          start.getTime();

        return (
          Math.floor(
            difference /
              (1000 * 60 * 60 * 24)
          ) + 1
        );
      };

      // -----------------------------------------
      // Build balance for every leave type
      // -----------------------------------------

      const balances = leaveTypes.map(
        (leaveType) => {
          const customBalance =
            employeeBalances.find(
              (balance) =>
                Number(
                  balance.leaveTypeId
                ) ===
                Number(leaveType.id)
            );

          // If employee has a custom balance,
          // use it. Otherwise use the default
          // leave type entitlement.
          const entitlement =
            customBalance
              ? Number(
                  customBalance.entitlement
                )
              : Number(
                  leaveType.totalDays
                );

          const typeRequests =
            requests.filter(
              (request) =>
                Number(
                  request.leaveTypeId
                ) ===
                Number(leaveType.id)
            );

          let used = 0;
          let pending = 0;

          typeRequests.forEach(
            (request) => {
              const days =
                calculateDays(
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
            }
          );

          const remaining = Math.max(
            entitlement -
              used -
              pending,
            0
          );

          return {
            id: leaveType.id,
            leaveTypeId:
              leaveType.id,

            name: leaveType.name,

            entitlement,

            used,

            pending,

            remaining,
          };
        }
      );

      res.status(200).json(balances);
    } catch (error) {
      console.error(
        "Failed to fetch employee leave balances:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch employee leave balances",
      });
    }
  }
);

// =========================================================
// CREATE LEAVE TYPE
// POST /api/leave-types
// =========================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      totalDays,
    } = req.body;

    if (!name || totalDays === undefined) {
      return res.status(400).json({
        message:
          "Name and totalDays are required",
      });
    }

    if (
      !Number.isInteger(
        Number(totalDays)
      ) ||
      Number(totalDays) <= 0
    ) {
      return res.status(400).json({
        message:
          "totalDays must be a positive whole number",
      });
    }

    const leaveType =
      await prisma.leaveType.create({
        data: {
          name: name.trim(),

          totalDays:
            Number(totalDays),
        },
      });

    res.status(201).json(
      leaveType
    );
  } catch (error) {
    console.error(
      "Failed to create leave type:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create leave type",
    });
  }
});

module.exports = router;