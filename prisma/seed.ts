import { prisma } from "../src/lib/db/prisma";

async function main() {
  // Kategoriler
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "fotograf-baskilari" },
      update: {},
      create: { name: "Fotoğraf Baskıları", slug: "fotograf-baskilari", description: "Anılarınızı en net ve canlı haliyle kağıda dökün." },
    }),
    prisma.category.upsert({
      where: { slug: "duvar-dekorasyonu" },
      update: {},
      create: { name: "Duvar Dekorasyonu", slug: "duvar-dekorasyonu", description: "Evinizin duvarlarını sanata dönüştürün." },
    }),
    prisma.category.upsert({
      where: { slug: "albumler-ve-kitaplar" },
      update: {},
      create: { name: "Albümler ve Kitaplar", slug: "albumler-ve-kitaplar", description: "Hikayenizi baştan sona sayfalarca anlatın." },
    }),
    prisma.category.upsert({
      where: { slug: "kisiye-ozel-hediyeler" },
      update: {},
      create: { name: "Kişiye Özel Hediyeler", slug: "kisiye-ozel-hediyeler", description: "Sevdiklerinizi mutlu edecek ince düşünülmüş detaylar." },
    }),
  ]);

  // Örnek ürünler
  await prisma.product.upsert({
    where: { slug: "foto-kitap-20x20" },
    update: {},
    create: {
      categoryId: categories[2].id,
      name: "Foto Kitap 20×20",
      slug: "foto-kitap-20x20",
      description: "20×20 cm sert kapaklı fotokitap. 24 sayfa dahil, ek sayfa eklenebilir.",
      basePrice: 349,
      images: [],
      specs: { size: "20x20cm", pages: 24, cover: "Sert Kapak" },
    },
  });

  await prisma.product.upsert({
    where: { slug: "polaroid-seti-16li" },
    update: {},
    create: {
      categoryId: categories[0].id,
      name: "Polaroid Baskı Seti (16'lı)",
      slug: "polaroid-seti-16li",
      description: "10×10 cm polaroid tarzı baskı, 16 adet.",
      basePrice: 189,
      images: [],
      specs: { size: "10x10cm", quantity: 16 },
    },
  });

  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
