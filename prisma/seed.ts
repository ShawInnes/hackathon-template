import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  //   const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase()
  //   if (!adminEmail) {
  //     console.warn("INITIAL_ADMIN_EMAIL not set — skipping admin seed")
  //     return
  //   }

  //   await prisma.employee.upsert({
  //     where: { email: adminEmail },
  //     update: { roleType: "ADMIN" },
  //     create: {
  //       employeeId: "ADMIN-0001",
  //       fullName: "Initial Admin",
  //       positionTitle: "Administrator",
  //       email: adminEmail,
  //       roleType: "ADMIN",
  //       fte: 1.0,
  //     },
  //   })

  console.log(`Seeded data`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
