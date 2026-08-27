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
// ADMIN-ONLY MIDDLEWARE
// =========================================================

function requireAdmin(req, res, next) {
  if (
    String(req.user.role || "").toUpperCase() !==
    "ADMIN"
  ) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

// =========================================================
// GET ALL LEAVE REQUESTS
// GET /api/admin/leave-requests
// =========================================================

router.get(
  "/leave-requests",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const requests =
        await prisma.leaveRequest.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },

            leaveType: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      res.status(200).json(requests);
    } catch (error) {
      console.error(
        "Failed to fetch admin leave requests:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch leave requests",
      });
    }
  }
);

// =========================================================
// APPROVE LEAVE REQUEST
// PATCH /api/admin/leave-requests/:id/approve
// =========================================================

router.patch(
  "/leave-requests/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            "Invalid leave request ID",
        });
      }

      const request =
        await prisma.leaveRequest.findUnique({
          where: {
            id,
          },
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Leave request not found",
        });
      }

      if (request.status !== "PENDING") {
        return res.status(400).json({
          message:
            "Only pending requests can be approved",
        });
      }

      const updatedRequest =
        await prisma.leaveRequest.update({
          where: {
            id,
          },

          data: {
            status: "APPROVED",
          },
        });

      res.status(200).json({
        message:
          "Leave request approved",

        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "Failed to approve leave request:",
        error
      );

      res.status(500).json({
        message:
          "Failed to approve leave request",
      });
    }
  }
);

// =========================================================
// REJECT LEAVE REQUEST
// PATCH /api/admin/leave-requests/:id/reject
// =========================================================

router.patch(
  "/leave-requests/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          message:
            "Invalid leave request ID",
        });
      }

      const request =
        await prisma.leaveRequest.findUnique({
          where: {
            id,
          },
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Leave request not found",
        });
      }

      if (request.status !== "PENDING") {
        return res.status(400).json({
          message:
            "Only pending requests can be rejected",
        });
      }

      const updatedRequest =
        await prisma.leaveRequest.update({
          where: {
            id,
          },

          data: {
            status: "REJECTED",
          },
        });

      res.status(200).json({
        message:
          "Leave request rejected",

        request:
          updatedRequest,
      });
    } catch (error) {
      console.error(
        "Failed to reject leave request:",
        error
      );

      res.status(500).json({
        message:
          "Failed to reject leave request",
      });
    }
  }
);

// =========================================================
// GET EMPLOYEE LEAVE BALANCES
// GET /api/admin/users/:userId/leave-balances
// =========================================================

router.get(
  "/users/:userId/leave-balances",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(
        req.params.userId
      );

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const leaveTypes =
        await prisma.leaveType.findMany({
          orderBy: {
            id: "asc",
          },
        });

      const balances =
        await prisma.employeeLeaveBalance.findMany({
          where: {
            userId,
          },

          select: {
            id: true,
            userId: true,
            leaveTypeId: true,
            entitlement: true,
          },
        });

      const result =
        leaveTypes.map(
          (leaveType) => {
            const existingBalance =
              balances.find(
                (balance) =>
                  Number(
                    balance.leaveTypeId
                  ) ===
                  Number(
                    leaveType.id
                  )
              );

            return {
              leaveTypeId:
                leaveType.id,

              leaveTypeName:
                leaveType.name,

              entitlement:
                existingBalance
                  ? existingBalance.entitlement
                  : leaveType.totalDays,

              balanceId:
                existingBalance?.id ||
                null,
            };
          }
        );

      res.status(200).json({
        user,
        balances: result,
      });
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
// UPDATE EMPLOYEE LEAVE BALANCE
// PUT /api/admin/users/:userId/leave-balances
// =========================================================

router.put(
  "/users/:userId/leave-balances",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(
        req.params.userId
      );

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message:
            "Invalid user ID",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found",
        });
      }

      const { balances } =
        req.body;

      if (!Array.isArray(balances)) {
        return res.status(400).json({
          message:
            "balances must be an array",
        });
      }

      const updatedBalances = [];

      for (const balance of balances) {
        const leaveTypeId =
          Number(
            balance.leaveTypeId
          );

        const entitlement =
          Number(
            balance.entitlement
          );

        if (
          !Number.isInteger(
            leaveTypeId
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid leave type ID",
          });
        }

        if (
          !Number.isInteger(
            entitlement
          ) ||
          entitlement < 0
        ) {
          return res.status(400).json({
            message:
              "Entitlement must be a whole number greater than or equal to 0",
          });
        }

        const leaveType =
          await prisma.leaveType.findUnique({
            where: {
              id: leaveTypeId,
            },
          });

        if (!leaveType) {
          return res.status(404).json({
            message:
              `Leave type ${leaveTypeId} not found`,
          });
        }

        const updated =
          await prisma.employeeLeaveBalance.upsert(
            {
              where: {
                userId_leaveTypeId: {
                  userId,
                  leaveTypeId,
                },
              },

              update: {
                entitlement,
              },

              create: {
                userId,
                leaveTypeId,
                entitlement,
              },
            }
          );

        updatedBalances.push(
          updated
        );
      }

      res.status(200).json({
        message:
          "Employee leave balances updated successfully",

        balances:
          updatedBalances,
      });
    } catch (error) {
      console.error(
        "Failed to update employee leave balances:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update employee leave balances",
      });
    }
  }
);

module.exports = router;