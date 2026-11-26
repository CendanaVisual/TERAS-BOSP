import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Membersihkan seluruh data dummy/seed laporan dan pengaduan...");

  const deletedExpenses = await prisma.expenseItem.deleteMany();
  const deletedPeriods = await prisma.budgetPeriod.deleteMany();
  const deletedFeedbacks = await prisma.publicFeedback.deleteMany();

  // Pastikan akun admin utama tetap siap digunakan untuk masuk ke Dashboard Admin
  const adminEmail = "sdn7pedungan63@gmail.com";
  const adminPasswordHash = await bcrypt.hash("terasbosp63", 10);

  await prisma.user.deleteMany({
    where: {
      email: { not: adminEmail },
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Bendahara Sekolah (Admin)",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Bendahara Sekolah (Admin)",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const existingProfile = await prisma.schoolProfile.findFirst();
  if (!existingProfile) {
    await prisma.schoolProfile.create({
      data: {
        name: "SD Negeri 7 Pedungan",
        npsn: "50103107",
        address:
          "Jl. Raya Sesetan No. 285, Kel. Pedungan, Kec. Denpasar Selatan, Kota Denpasar, Bali 80222",
        headmaster: "Ni Luh Putu Sariani, S.Pd., M.Pd.",
        treasurer: "I Made Adi Wirawan, S.Pd.",
        phone: "(0361) 720418",
        email: "sdn7pedungan63@gmail.com",
        district: "Kec. Denpasar Selatan, Kota Denpasar",
        province: "Provinsi Bali",
      },
    });
  }

  console.log("Pembersihan selesai!", {
    deletedExpenses: deletedExpenses.count,
    deletedPeriods: deletedPeriods.count,
    deletedFeedbacks: deletedFeedbacks.count,
    activeAdmin: adminEmail,
  });
}

main()
  .catch((err) => {
    console.error("Gagal membersihkan data:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
