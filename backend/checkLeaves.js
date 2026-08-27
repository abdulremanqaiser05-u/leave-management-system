require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function deleteLeave() {
  try {
    const request = await prisma.leaveRequest.findUnique({
      where: {
        id: 4,
      },
    });

    if (!request) {
      console.log("Leave request ID 4 does not exist.");
      return;
    }

    await prisma.leaveRequest.delete({
      where: {
        id: 4,
      },
    });

    console.log("SUCCESS: Leave request ID 4 deleted.");
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteLeave();