require("dotenv").config();

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("AdminPassword123", 10);

    const admin = await prisma.user.upsert({
      where: {
        email: "admin@example.com",
      },
      update: {
        role: "ADMIN",
        password: hashedPassword,
      },
      create: {
        name: "System Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("Admin account created successfully!");
    console.log({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();