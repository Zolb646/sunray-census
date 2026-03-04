import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up in FK-safe order
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.clothingItem.deleteMany();
  await prisma.admin.deleteMany();

  // Seed clothing items
  const items = await Promise.all([
    prisma.clothingItem.create({
      data: {
        name: "Floral Wrap Dress",
        category: "Dress",
        sizes: ["XS", "S", "M", "L"],
        costPrice: 2500,
        sellingPrice: 5999,
        stockQty: 12,
        lowStockThreshold: 5,
        description: "Beautiful floral pattern wrap dress",
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Linen Button-Down Top",
        category: "Top",
        sizes: ["XS", "S", "M", "L", "XL"],
        costPrice: 1200,
        sellingPrice: 2999,
        stockQty: 3,
        lowStockThreshold: 5,
        description: "Casual linen summer top",
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "High-Waist Slim Pants",
        category: "Pants",
        sizes: ["S", "M", "L"],
        costPrice: 1800,
        sellingPrice: 4499,
        stockQty: 8,
        lowStockThreshold: 3,
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Pleated Mini Skirt",
        category: "Skirt",
        sizes: ["XS", "S", "M"],
        costPrice: 900,
        sellingPrice: 2499,
        stockQty: 2,
        lowStockThreshold: 4,
        description: "Trendy pleated mini skirt",
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Oversized Blazer",
        category: "Outerwear",
        sizes: ["S", "M", "L", "XL"],
        costPrice: 3500,
        sellingPrice: 8999,
        stockQty: 6,
        lowStockThreshold: 3,
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Ribbed Knit Crop Top",
        category: "Top",
        sizes: ["XS", "S", "M", "L"],
        costPrice: 800,
        sellingPrice: 1999,
        stockQty: 1,
        lowStockThreshold: 5,
        description: "Stretchy ribbed knit crop top",
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Maxi Bohemian Dress",
        category: "Dress",
        sizes: ["S", "M", "L", "XL"],
        costPrice: 3200,
        sellingPrice: 7499,
        stockQty: 5,
        lowStockThreshold: 3,
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Wide-Leg Denim Pants",
        category: "Pants",
        sizes: ["S", "M", "L"],
        costPrice: 2200,
        sellingPrice: 5499,
        stockQty: 9,
        lowStockThreshold: 4,
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Flowy Midi Skirt",
        category: "Skirt",
        sizes: ["XS", "S", "M", "L"],
        costPrice: 1100,
        sellingPrice: 2999,
        stockQty: 4,
        lowStockThreshold: 4,
        description: "Elegant flowing midi skirt",
      },
    }),
    prisma.clothingItem.create({
      data: {
        name: "Trench Coat",
        category: "Outerwear",
        sizes: ["S", "M", "L"],
        costPrice: 5500,
        sellingPrice: 12999,
        stockQty: 3,
        lowStockThreshold: 2,
      },
    }),
  ]);

  console.log(`Created ${items.length} clothing items`);

  // Seed sales over last 20 days
  const now = new Date();
  const salesData = [
    { daysAgo: 1, itemIdx: 0, qty: 1, payment: "CASH" as const },
    { daysAgo: 2, itemIdx: 2, qty: 2, payment: "CARD" as const },
    { daysAgo: 3, itemIdx: 4, qty: 1, payment: "TRANSFER" as const },
    { daysAgo: 5, itemIdx: 1, qty: 3, payment: "CASH" as const },
    { daysAgo: 6, itemIdx: 6, qty: 1, payment: "CARD" as const },
    { daysAgo: 8, itemIdx: 3, qty: 2, payment: "CASH" as const },
    { daysAgo: 10, itemIdx: 7, qty: 1, payment: "CARD" as const },
    { daysAgo: 12, itemIdx: 5, qty: 2, payment: "CASH" as const },
    { daysAgo: 15, itemIdx: 9, qty: 1, payment: "TRANSFER" as const },
    {
      daysAgo: 18,
      itemIdx: 8,
      qty: 1,
      payment: "CASH" as const,
      canceled: true,
    },
  ];

  for (const s of salesData) {
    const item = items[s.itemIdx];
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - s.daysAgo);
    const total = item.sellingPrice * s.qty;

    const sale = await prisma.sale.create({
      data: {
        status: s.canceled ? "CANCELED" : "COMPLETED",
        total,
        paymentMethod: s.payment,
        createdAt: saleDate,
        updatedAt: saleDate,
        items: {
          create: [
            {
              clotheId: item.id,
              qty: s.qty,
              unitPrice: item.sellingPrice,
              total,
            },
          ],
        },
      },
    });

    if (!s.canceled) {
      await prisma.clothingItem.update({
        where: { id: item.id },
        data: { stockQty: { decrement: s.qty } },
      });
      await prisma.stockMovement.create({
        data: {
          clotheId: item.id,
          changeQty: -s.qty,
          reason: "SALE",
          note: `Sale #${sale.id}`,
          createdAt: saleDate,
        },
      });
    }
  }

  console.log(`Created ${salesData.length} sales`);

  // Seed expenses
  const expenseData = [
    {
      daysAgo: 2,
      amount: 50000,
      category: "RENT" as const,
      description: "Monthly store rent",
    },
    {
      daysAgo: 3,
      amount: 5000,
      category: "UTILITIES" as const,
      description: "Electricity bill",
    },
    {
      daysAgo: 5,
      amount: 8000,
      category: "SUPPLIES" as const,
      description: "Packaging materials",
    },
    {
      daysAgo: 7,
      amount: 15000,
      category: "MARKETING" as const,
      description: "Social media ads",
    },
    {
      daysAgo: 8,
      amount: 80000,
      category: "SALARY" as const,
      description: "Staff salary",
    },
    {
      daysAgo: 10,
      amount: 3000,
      category: "UTILITIES" as const,
      description: "Water bill",
    },
    {
      daysAgo: 12,
      amount: 6000,
      category: "SUPPLIES" as const,
      description: "Hangers & display items",
    },
    {
      daysAgo: 14,
      amount: 10000,
      category: "MARKETING" as const,
      description: "Flyer printing",
    },
    {
      daysAgo: 16,
      amount: 2000,
      category: "OTHER" as const,
      description: "Miscellaneous expenses",
    },
    {
      daysAgo: 19,
      amount: 4000,
      category: "SUPPLIES" as const,
      description: "Cleaning supplies",
    },
  ];

  for (const e of expenseData) {
    const expDate = new Date(now);
    expDate.setDate(now.getDate() - e.daysAgo);
    await prisma.expense.create({
      data: {
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: expDate,
        createdAt: expDate,
      },
    });
  }

  console.log(`Created ${expenseData.length} expenses`);
  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
