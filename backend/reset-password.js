require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function resetPassword() {
  const hashedPassword = await bcrypt.hash("12341234", 10);

  await prisma.user.update({
    where: {
      email: "abdul@example.com",
    },
    data: {
      password: hashedPassword,
    },
  });

  console.log("Employee password reset successfully.");
  await prisma.$disconnect();
}

resetPassword();