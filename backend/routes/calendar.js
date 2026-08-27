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

// Convert database DateTime into YYYY-MM-DD
function formatDateOnly(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// GET /api/calendar
// Get all users and their approved leave
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,

        leaveRequests: {
          where: {
            status: "APPROVED",
          },

          select: {
            id: true,
            startDate: true,
            endDate: true,

            leaveType: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            startDate: "asc",
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    const calendarData = users.map((user) => {
      return {
        id: user.id,
        name: user.name,
        role: user.role,

        leaves: user.leaveRequests.map((leave) => {
          return {
            id: leave.id,

            // IMPORTANT:
            // Send date-only values to frontend.
            startDate: formatDateOnly(leave.startDate),
            endDate: formatDateOnly(leave.endDate),

            leaveType: leave.leaveType.name,
          };
        }),
      };
    });

    res.status(200).json(calendarData);
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);

    res.status(500).json({
      message: "Failed to fetch calendar data",
    });
  }
});

module.exports = router;