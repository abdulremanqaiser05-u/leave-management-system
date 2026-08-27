require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function checkLeaves() {
  try {
    const requests = await prisma.leaveRequest.findMany({
      include: {
        user: true,
        leaveType: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log("\n===== ALL LEAVE REQUESTS =====\n");

    requests.forEach((request) => {
      console.log(
        `ID: ${request.id} | User: ${request.user.name} | ` +
        `Start: ${request.startDate.toISOString().slice(0, 10)} | ` +
        `End: ${request.endDate.toISOString().slice(0, 10)} | ` +
        `Status: ${request.status} | ` +
        `Type: ${request.leaveType.name}`
      );
    });

    console.log("\n==============================\n");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLeaves();