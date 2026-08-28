const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// --------------------------------------------------
// Prisma
// --------------------------------------------------

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

// --------------------------------------------------
// POST /api/auth/login
// --------------------------------------------------

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // ----------------------------------------------
    // Validate request
    // ----------------------------------------------

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ----------------------------------------------
    // Check required environment variables
    // ----------------------------------------------

    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is missing");

      return res.status(500).json({
        message: "Server database configuration is missing",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");

      return res.status(500).json({
        message: "Server authentication configuration is missing",
      });
    }

    // ----------------------------------------------
    // Find user
    // ----------------------------------------------

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ----------------------------------------------
    // Verify password
    // ----------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ----------------------------------------------
    // Create JWT
    // ----------------------------------------------

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // ----------------------------------------------
    // Successful login
    // ----------------------------------------------

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("=================================");
    console.error("LOGIN ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      message: "Login failed",
    });
  }
});

// --------------------------------------------------
// Export
// --------------------------------------------------

module.exports = router;