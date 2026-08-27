const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");

const {
  PrismaClient,
} = require("@prisma/client");

const {
  PrismaPg,
} = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL,
  }),
});

// =========================================================
// HELPERS
// =========================================================

const startOfDay = (date) => {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
};

const calculateDays = (
  startDate,
  endDate
) => {
  const start =
    startOfDay(startDate);

  const end =
    startOfDay(endDate);

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

// =========================================================
// GET MY LEAVE BALANCE
//
// GET /api/leave-requests/balance
//
// IMPORTANT:
// This ALWAYS uses the userId from the JWT.
// It does NOT use a user ID from the frontend.
// =========================================================

router.get(
  "/balance",
  authenticateToken,
  async (req, res) => {
    try {
      // =====================================================
      // 1. GET AUTHENTICATED USER ID
      // =====================================================

      const userId = Number(
        req.user.userId
      );

      console.log(
        "========================================"
      );

      console.log(
        "BALANCE REQUEST USER ID:",
        userId
      );

      console.log(
        "BALANCE REQUEST ROLE:",
        req.user.role
      );

      console.log(
        "========================================"
      );

      if (
        !userId ||
        Number.isNaN(userId)
      ) {
        return res.status(400).json({
          message:
            "Invalid authenticated user.",
        });
      }

      // =====================================================
      // 2. GET EXACT USER FROM DATABASE
      // =====================================================

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

      console.log(
        "DATABASE USER:",
        user
      );

      if (!user) {
        return res.status(404).json({
          message:
            "Authenticated user was not found in the database.",
        });
      }

      // =====================================================
      // 3. GET ALL LEAVE TYPES
      // =====================================================

      const leaveTypes =
        await prisma.leaveType.findMany({
          orderBy: {
            id: "asc",
          },
        });

      // =====================================================
      // 4. GET ONLY THIS EMPLOYEE'S BALANCES
      // =====================================================

      let balances =
        await prisma.employeeLeaveBalance.findMany({
          where: {
            userId: userId,
          },

          include: {
            leaveType: true,
          },

          orderBy: {
            leaveTypeId: "asc",
          },
        });

      console.log(
        "EMPLOYEE BALANCES:",
        balances
      );

      // =====================================================
      // 5. CREATE MISSING BALANCES
      //
      // IMPORTANT:
      // These are created FOR THIS USER ONLY.
      // =====================================================

      for (
        const leaveType of leaveTypes
      ) {
        const exists =
          balances.some(
            (balance) =>
              Number(
                balance.leaveTypeId
              ) ===
              Number(
                leaveType.id
              )
          );

        if (!exists) {
          const newBalance =
            await prisma.employeeLeaveBalance.create({
              data: {
                userId: userId,

                leaveTypeId:
                  leaveType.id,

                entitlement:
                  Number(
                    leaveType.totalDays
                  ) || 0,
              },

              include: {
                leaveType: true,
              },
            });

          balances.push(
            newBalance
          );
        }
      }

      // =====================================================
      // 6. GET ONLY THIS EMPLOYEE'S LEAVE REQUESTS
      // =====================================================

      const requests =
        await prisma.leaveRequest.findMany({
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

          orderBy: {
            createdAt: "desc",
          },
        });

      console.log(
        "EMPLOYEE LEAVE REQUESTS:",
        requests
      );

      // =====================================================
      // 7. CALCULATE EACH LEAVE TYPE
      // =====================================================

      const result =
        balances.map(
          (balance) => {

            const approvedDays =
              requests
                .filter(
                  (request) =>
                    Number(
                      request.leaveTypeId
                    ) ===
                      Number(
                        balance.leaveTypeId
                      ) &&
                    String(
                      request.status
                    ).toUpperCase() ===
                      "APPROVED"
                )
                .reduce(
                  (
                    total,
                    request
                  ) =>
                    total +
                    calculateDays(
                      request.startDate,
                      request.endDate
                    ),
                  0
                );

            const pendingDays =
              requests
                .filter(
                  (request) =>
                    Number(
                      request.leaveTypeId
                    ) ===
                      Number(
                        balance.leaveTypeId
                      ) &&
                    String(
                      request.status
                    ).toUpperCase() ===
                      "PENDING"
                )
                .reduce(
                  (
                    total,
                    request
                  ) =>
                    total +
                    calculateDays(
                      request.startDate,
                      request.endDate
                    ),
                  0
                );

            const entitlement =
              Number(
                balance.entitlement
              ) || 0;

            return {
              id: balance.id,

              userId: userId,

              leaveTypeId:
                balance.leaveTypeId,

              name:
                balance.leaveType.name,

              entitlement:

                entitlement,

              used:
                approvedDays,

              pending:
                pendingDays,

              remaining:
                Math.max(
                  entitlement -
                    approvedDays,
                  0
                ),

              available:
                Math.max(
                  entitlement -
                    approvedDays -
                    pendingDays,
                  0
                ),
            };
          }
        );

      // =====================================================
      // 8. TOTAL ALLOWANCE
      // =====================================================

      const totalAllowance =
        result.reduce(
          (
            total,
            balance
          ) =>
            total +
            Number(
              balance.entitlement
            ),
          0
        );

      // =====================================================
      // 9. TOTAL USED
      // =====================================================

      const usedDays =
        result.reduce(
          (
            total,
            balance
          ) =>
            total +
            Number(
              balance.used
            ),
          0
        );

      // =====================================================
      // 10. TOTAL PENDING DAYS
      // =====================================================

      const pendingDays =
        result.reduce(
          (
            total,
            balance
          ) =>
            total +
            Number(
              balance.pending
            ),
          0
        );

      // =====================================================
      // 11. REMAINING DAYS
      // =====================================================

      const remainingDays =
        Math.max(
          totalAllowance -
            usedDays,
          0
        );

      // =====================================================
      // 12. AVAILABLE DAYS
      // =====================================================

      const availableDays =
        Math.max(
          totalAllowance -
            usedDays -
            pendingDays,
          0
        );

      // =====================================================
      // 13. TODAY
      // =====================================================

      const today =
        startOfDay(
          new Date()
        );

      // =====================================================
      // 14. UPCOMING LEAVE
      //
      // ONLY THIS EMPLOYEE'S REQUESTS
      // =====================================================

      const upcomingRequests =
        requests.filter(
          (request) => {

            const status =
              String(
                request.status
              ).toUpperCase();

            const endDate =
              startOfDay(
                request.endDate
              );

            return (
              endDate >= today &&
              status !==
                "REJECTED" &&
              status !==
                "DECLINED"
            );
          }
        );

      // =====================================================
      // 15. UPCOMING DAYS
      // =====================================================

      const upcomingDays =
        upcomingRequests.reduce(
          (
            total,
            request
          ) =>
            total +
            calculateDays(
              request.startDate,
              request.endDate
            ),
          0
        );

      // =====================================================
      // 16. PENDING REQUEST COUNT
      // =====================================================

      const pendingRequestCount =
        requests.filter(
          (request) =>
            String(
              request.status
            ).toUpperCase() ===
            "PENDING"
        ).length;

      // =====================================================
      // 17. FINAL RESPONSE
      // =====================================================

      const response = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },

        balances: result,

        totals: {
          allowance:
            totalAllowance,

          used:
            usedDays,

          upcoming:
            upcomingDays,

          pending:
            pendingRequestCount,

          pendingDays:
            pendingDays,

          remaining:
            remainingDays,

          available:
            availableDays,
        },

        debug: {
          authenticatedUserId:
            userId,

          databaseUserId:
            user.id,

          requestCount:
            requests.length,

          upcomingRequestCount:
            upcomingRequests.length,

          pendingRequestCount:
            pendingRequestCount,
        },
      };

      console.log(
        "========================================"
      );

      console.log(
        "FINAL BALANCE RESPONSE:"
      );

      console.log(
        JSON.stringify(
          response,
          null,
          2
        )
      );

      console.log(
        "========================================"
      );

      return res
        .status(200)
        .json(response);

    } catch (error) {

      console.error(
        "Failed to fetch leave balance:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch leave balance",

        error:
          error.message,
      });
    }
  }
);

// =========================================================
// GET MY LEAVE REQUESTS
//
// GET /api/leave-requests
// =========================================================

router.get(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(
        req.user.userId
      );

      console.log(
        "MY LEAVE REQUESTS USER ID:",
        userId
      );

      if (
        !userId ||
        Number.isNaN(userId)
      ) {
        return res.status(400).json({
          message:
            "Invalid user ID in authentication token.",
        });
      }

      const requests =
        await prisma.leaveRequest.findMany({
          where: {
            userId: userId,
          },

          include: {
            leaveType: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      console.log(
        "MY LEAVE REQUESTS:",
        requests
      );

      return res.status(200).json(
        requests
      );

    } catch (error) {

      console.error(
        "Failed to fetch my leave requests:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch leave requests",
      });
    }
  }
);

// =========================================================
// CREATE LEAVE REQUEST
//
// POST /api/leave-requests
// =========================================================

router.post(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        reason,
        leaveTypeId,
      } = req.body;

      const userId = Number(
        req.user.userId
      );

      console.log(
        "CREATING LEAVE REQUEST FOR USER:",
        userId
      );

      if (
        !startDate ||
        !endDate ||
        !leaveTypeId
      ) {
        return res.status(400).json({
          message:
            "startDate, endDate and leaveTypeId are required",
        });
      }

      if (
        !userId ||
        Number.isNaN(userId)
      ) {
        return res.status(400).json({
          message:
            "Invalid authenticated user.",
        });
      }

      const numericLeaveTypeId =
        Number(leaveTypeId);

      if (
        !Number.isInteger(
          numericLeaveTypeId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid leave type.",
        });
      }

      const start =
        new Date(startDate);

      const end =
        new Date(endDate);

      if (
        Number.isNaN(
          start.getTime()
        ) ||
        Number.isNaN(
          end.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid startDate or endDate.",
        });
      }

      const startDay =
        startOfDay(start);

      const endDay =
        startOfDay(end);

      if (endDay < startDay) {
        return res.status(400).json({
          message:
            "End date cannot be before start date.",
        });
      }

      const today =
        startOfDay(
          new Date()
        );

      if (startDay < today) {
        return res.status(400).json({
          message:
            "Start date cannot be in the past.",
        });
      }

      const requestedDays =
        calculateDays(
          startDay,
          endDay
        );

      const leaveType =
        await prisma.leaveType.findUnique({
          where: {
            id:
              numericLeaveTypeId,
          },
        });

      if (!leaveType) {
        return res.status(404).json({
          message:
            "Leave type not found.",
        });
      }

      // =====================================================
      // GET PERSONAL BALANCE
      // =====================================================

      let personalBalance =
        await prisma.employeeLeaveBalance.findUnique({
          where: {
            userId_leaveTypeId: {
              userId,

              leaveTypeId:
                numericLeaveTypeId,
            },
          },
        });

      // =====================================================
      // CREATE MISSING PERSONAL BALANCE
      // =====================================================

      if (!personalBalance) {
        personalBalance =
          await prisma.employeeLeaveBalance.create({
            data: {
              userId,

              leaveTypeId:
                numericLeaveTypeId,

              entitlement:
                Number(
                  leaveType.totalDays
                ) || 0,
            },
          });
      }

      // =====================================================
      // GET ACTIVE REQUESTS FOR THIS USER
      // =====================================================

      const activeRequests =
        await prisma.leaveRequest.findMany({
          where: {
            userId,

            leaveTypeId:
              numericLeaveTypeId,

            status: {
              in: [
                "APPROVED",
                "PENDING",
              ],
            },
          },

          select: {
            startDate: true,
            endDate: true,
            status: true,
          },
        });

      let usedDays = 0;

      let pendingDays = 0;

      activeRequests.forEach(
        (request) => {

          const days =
            calculateDays(
              request.startDate,
              request.endDate
            );

          if (
            String(
              request.status
            ).toUpperCase() ===
            "APPROVED"
          ) {
            usedDays += days;
          }

          if (
            String(
              request.status
            ).toUpperCase() ===
            "PENDING"
          ) {
            pendingDays += days;
          }
        }
      );

      // =====================================================
      // CHECK AVAILABLE DAYS
      // =====================================================

      const entitlement =
        Number(
          personalBalance.entitlement
        ) || 0;

      const availableDays =
        Math.max(
          entitlement -
            usedDays -
            pendingDays,
          0
        );

      if (
        requestedDays >
        availableDays
      ) {
        return res.status(400).json({
          message:
            `You only have ${availableDays} ${leaveType.name} day${
              availableDays === 1
                ? ""
                : "s"
            } available. You requested ${requestedDays} days.`,
        });
      }

      // =====================================================
      // CHECK OVERLAPPING REQUESTS
      // =====================================================

      const overlappingRequests =
        await prisma.leaveRequest.findMany({
          where: {
            userId,

            status: {
              in: [
                "PENDING",
                "APPROVED",
              ],
            },

            startDate: {
              lte: endDay,
            },

            endDate: {
              gte: startDay,
            },
          },

          include: {
            leaveType: true,
          },
        });

      if (
        overlappingRequests.length >
        0
      ) {
        const overlapping =
          overlappingRequests[0];

        return res.status(409).json({
          message:
            `These dates overlap with an existing ${String(
              overlapping.status
            ).toLowerCase()} ${overlapping.leaveType.name} request.`,
        });
      }

      // =====================================================
      // CREATE REQUEST FOR AUTHENTICATED USER
      // =====================================================

      const leaveRequest =
        await prisma.leaveRequest.create({
          data: {
            startDate:
              startDay,

            endDate:
              endDay,

            reason:
              typeof reason ===
              "string"
                ? reason.trim() ||
                  null
                : null,

            status:
              "PENDING",

            userId:

              userId,

            leaveTypeId:
              numericLeaveTypeId,
          },

          include: {
            leaveType: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      console.log(
        "CREATED LEAVE REQUEST:",
        leaveRequest
      );

      return res
        .status(201)
        .json(
          leaveRequest
        );

    } catch (error) {

      console.error(
        "Failed to create leave request:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create leave request",

        error:
          error.message,
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;