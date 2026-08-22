const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

// GET /api/users
// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.code || "UNKNOWN_ERROR",
    });
  }
});

module.exports = router;