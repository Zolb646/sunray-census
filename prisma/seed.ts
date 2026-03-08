import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PaymentMethod, PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
});

type SeedPayment = {
  method: PaymentMethod;
  amount: number;
};

type SeedSale = {
  daysAgo: number;
  itemIdx: number;
  qty: number;
  payments: SeedPayment[];
  canceled?: boolean;
};

async function main() {
  console.log("Seeding database...");

  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.clothingItem.deleteMany();
  await prisma.admin.deleteMany();

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

  const now = new Date();
  const salesData: SeedSale[] = [
    { daysAgo: 1, itemIdx: 0, qty: 1, payments: [{ method: "CASH", amount: 5999 }] },
    { daysAgo: 2, itemIdx: 2, qty: 2, payments: [{ method: "CARD", amount: 8998 }] },
    { daysAgo: 3, itemIdx: 4, qty: 1, payments: [{ method: "QPAY", amount: 8999 }] },
    {
      daysAgo: 5,
      itemIdx: 1,
      qty: 3,
      payments: [
        { method: "CASH", amount: 4500 },
        { method: "QPAY", amount: 4497 },
      ],
    },
    { daysAgo: 6, itemIdx: 6, qty: 1, payments: [{ method: "CARD", amount: 7499 }] },
    {
      daysAgo: 8,
      itemIdx: 3,
      qty: 2,
      payments: [
        { method: "CASH", amount: 2500 },
        { method: "TRANSFER", amount: 2498 },
      ],
    },
    { daysAgo: 10, itemIdx: 7, qty: 1, payments: [{ method: "CARD", amount: 5499 }] },
    { daysAgo: 12, itemIdx: 5, qty: 2, payments: [{ method: "CASH", amount: 3998 }] },
    { daysAgo: 15, itemIdx: 9, qty: 1, payments: [{ method: "TRANSFER", amount: 12999 }] },
    {
      daysAgo: 18,
      itemIdx: 8,
      qty: 1,
      payments: [{ method: "CASH", amount: 2999 }],
      canceled: true,
    },
  ];

  for (const s of salesData) {
    const item = items[s.itemIdx];
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - s.daysAgo);
    const total = item.sellingPrice * s.qty;
    const paymentMethod = s.payments.slice().sort((a, b) => b.amount - a.amount)[0].method;

    const sale = await prisma.sale.create({
      data: {
        status: s.canceled ? "CANCELED" : "COMPLETED",
        total,
        paymentMethod,
        paymentBreakdown: s.payments,
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

  const expenseData = [
    { daysAgo: 2, amount: 50000, category: "RENT" as const, description: "Monthly store rent" },
    { daysAgo: 3, amount: 5000, category: "UTILITIES" as const, description: "Electricity bill" },
    { daysAgo: 5, amount: 8000, category: "SUPPLIES" as const, description: "Packaging materials" },
    { daysAgo: 7, amount: 15000, category: "MARKETING" as const, description: "Social media ads" },
    { daysAgo: 8, amount: 80000, category: "SALARY" as const, description: "Staff salary" },
    { daysAgo: 10, amount: 3000, category: "UTILITIES" as const, description: "Water bill" },
    { daysAgo: 12, amount: 6000, category: "SUPPLIES" as const, description: "Hangers & display items" },
    { daysAgo: 14, amount: 10000, category: "MARKETING" as const, description: "Flyer printing" },
    { daysAgo: 16, amount: 2000, category: "OTHER" as const, description: "Miscellaneous expenses" },
    { daysAgo: 19, amount: 4000, category: "SUPPLIES" as const, description: "Cleaning supplies" },
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