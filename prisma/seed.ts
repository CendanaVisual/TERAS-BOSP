import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Inisialisasi akun admin dan profil sekolah dasar TERAS-BOSP...");

  // 1. Admin User (idempotent upsert, hapus akun demo lama jika ada)
  const adminEmail = "sdn7pedungan63@gmail.com";
  const adminPasswordHash = await bcrypt.hash("terasbosp63", 10);

  await prisma.user.deleteMany({
    where: {
      email: "admin@teras-bosp.sch.id",
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

  // 2. Profil sekolah dasar (hanya dibuat jika belum ada agar edit dari dashboard admin tidak tertimpa)
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

  console.log(
    `Inisialisasi selesai! Database bersih tanpa data dummy. Akun Admin aktif: ${adminEmail}`
  );
}

main()
  .catch((err) => {
    console.error("Error saat inisialisasi database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
