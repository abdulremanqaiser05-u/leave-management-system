const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");

const {
  PrismaClient,
} = require("@prisma/client");

const {
  PrismaPg,
} = require("@prisma/adapter-pg");

const bcrypt = require("bcrypt");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL,
  }),
});

// =========================================================
// ADMIN MIDDLEWARE
// =========================================================

function requireAdmin(req, res, next) {
  if (
    String(req.user?.role || "").toUpperCase() !==
    "ADMIN"
  ) {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

// =========================================================
// GET ALL USERS
// GET /api/users
// =========================================================

router.get(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const users =
        await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,

            leaveRequests: {
              where: {
                status: "APPROVED",
              },

              select: {
                startDate: true,
                endDate: true,
              },
            },
          },

          orderBy: {
            id: "asc",
          },
        });

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const calculateDays = (
        startDate,
        endDate
      ) => {
        const start =
          new Date(startDate);

        const end =
          new Date(endDate);

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

      const result = users.map(
        (user) => {
          const onLeave =
            user.leaveRequests.some(
              (request) => {
                const start =
                  new Date(
                    request.startDate
                  );

                const end =
                  new Date(
                    request.endDate
                  );

                start.setHours(
                  0,
                  0,
                  0,
                  0
                );

                end.setHours(
                  0,
                  0,
                  0,
                  0
                );

                return (
                  today >= start &&
                  today <= end
                );
              }
            );

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt:
              user.createdAt,

            status: onLeave
              ? "On Leave"
              : "Available",
          };
        }
      );

      return res.status(200).json(
        result
      );
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch users",
      });
    }
  }
);

// =========================================================
// GET MY LEAVE BALANCE
// GET /api/users/me/leave-balance
//
// IMPORTANT:
// This automatically creates missing balance records
// for existing employees and new leave types.
// =========================================================

router.get(
  "/me/leave-balance",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(
        req.user.userId
      );

      if (
        !userId ||
        Number.isNaN(userId)
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID.",
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
      // Automatically create missing balances
      // -----------------------------------------

      for (const leaveType of leaveTypes) {
        await prisma.employeeLeaveBalance.upsert(
          {
            where: {
              userId_leaveTypeId: {
                userId: userId,
                leaveTypeId:
                  leaveType.id,
              },
            },

            update: {},

            create: {
              userId: userId,
              leaveTypeId:
                leaveType.id,
              entitlement:
                Number(
                  leaveType.totalDays
                ) || 0,
            },
          }
        );
      }

      // -----------------------------------------
      // Get employee balances
      // -----------------------------------------

      const balances =
        await prisma.employeeLeaveBalance.findMany(
          {
            where: {
              userId: userId,
            },

            include: {
              leaveType: true,
            },

            orderBy: {
              leaveTypeId: "asc",
            },
          }
        );

      // -----------------------------------------
      // Get employee requests
      // -----------------------------------------

      const requests =
        await prisma.leaveRequest.findMany(
          {
            where: {
              userId: userId,
            },

            select: {
              id: true,
              startDate: true,
              endDate: true,
              status: true,
              leaveTypeId: true,
            },
          }
        );

      // -----------------------------------------
      // Calculate days
      // -----------------------------------------

      const calculateDays = (
        startDate,
        endDate
      ) => {
        const start =
          new Date(startDate);

        const end =
          new Date(endDate);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const difference =
          end.getTime() -
          start.getTime();

        if (difference < 0) {
          return 0;
        }

        return (
          Math.floor(
            difference /
              (1000 * 60 * 60 * 24)
          ) + 1
        );
      };

      // -----------------------------------------
      // Build individual balances
      // -----------------------------------------

      const result =
        balances.map(
          (balance) => {
            const typeRequests =
              requests.filter(
                (request) =>
                  Number(
                    request.leaveTypeId
                  ) ===
                  Number(
                    balance.leaveTypeId
                  )
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

            const entitlement =
              Number(
                balance.entitlement
              ) || 0;

            const remaining =
              Math.max(
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
                balance.leaveType
                  .name,

              entitlement,

              used,

              pending,

              remaining,
            };
          }
        );

      // -----------------------------------------
      // Totals for employee
      // -----------------------------------------

      const totalAllowance =
        result.reduce(
          (total, balance) =>
            total +
            balance.entitlement,
          0
        );

      const totalUsed =
        result.reduce(
          (total, balance) =>
            total + balance.used,
          0
        );

      const totalPending =
        result.reduce(
          (total, balance) =>
            total + balance.pending,
          0
        );

      const totalRemaining =
        result.reduce(
          (total, balance) =>
            total + balance.remaining,
          0
        );

      return res.status(200).json({
        userId,

        totalAllowance,

        used: totalUsed,

        pending: totalPending,

        remaining: totalRemaining,

        balances: result,
      });
    } catch (error) {
      console.error(
        "Failed to fetch employee leave balance:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch employee leave balance",
      });
    }
  }
);

// =========================================================
// CREATE USER
// POST /api/users
//
// NEW EMPLOYEE AUTOMATICALLY GETS BALANCES
// =========================================================

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      // -----------------------------------------
      // VALIDATION
      // -----------------------------------------

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Name, email and password are required.",
        });
      }

      if (
        password.length < 6
      ) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters.",
        });
      }

      // -----------------------------------------
      // CHECK EXISTING EMAIL
      // -----------------------------------------

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email:
              email.trim(),
          },
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "A user with this email already exists.",
        });
      }

      // -----------------------------------------
      // HASH PASSWORD
      // -----------------------------------------

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      // -----------------------------------------
      // CREATE USER
      // -----------------------------------------

      const newUser =
        await prisma.user.create({
          data: {
            name:
              name.trim(),

            email:
              email.trim(),

            password:
              hashedPassword,

            role:
              role?.trim() ||
              "EMPLOYEE",
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

      // -----------------------------------------
      // GET ALL LEAVE TYPES
      // -----------------------------------------

      const leaveTypes =
        await prisma.leaveType.findMany();

      // -----------------------------------------
      // CREATE BALANCE FOR EVERY LEAVE TYPE
      // -----------------------------------------

      if (
        leaveTypes.length > 0
      ) {
        await prisma.employeeLeaveBalance.createMany(
          {
            data:
              leaveTypes.map(
                (leaveType) => ({
                  userId:
                    newUser.id,

                  leaveTypeId:
                    leaveType.id,

                  entitlement:
                    Number(
                      leaveType.totalDays
                    ) || 0,
                })
              ),
            skipDuplicates: true,
          }
        );
      }

      return res.status(201).json(
        newUser
      );
    } catch (error) {
      console.error(
        "Failed to create user:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create user",
      });
    }
  }
);

// =========================================================
// DELETE USER
// DELETE /api/users/:id
// =========================================================

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !id ||
        Number.isNaN(id)
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID.",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id,
          },
        });

      if (!user) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      // -----------------------------------------
      // NEVER DELETE ADMIN
      // -----------------------------------------

      if (
        String(
          user.role
        ).toUpperCase() ===
        "ADMIN"
      ) {
        return res.status(400).json({
          message:
            "Admin accounts cannot be removed.",
        });
      }

      await prisma.user.delete({
        where: {
          id,
        },
      });

      return res.status(200).json({
        message:
          "Team member removed successfully.",
      });
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to remove team member.",
      });
    }
  }
);

module.exports = router;