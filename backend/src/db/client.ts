import { config } from "../config/index.js";

// In-memory persistent collections for local dev & testing without active PostgreSQL
const memoryStore = {
  users: new Map<string, any>(),
  tours: new Map<string, any>(),
  orders: new Map<string, any>(),
  payments: new Map<string, any>(),
  paymentTransactions: new Map<string, any>(),
  refunds: new Map<string, any>(),
  partnerEarnings: new Map<string, any>(),
  partners: new Map<string, any>(),
  partnerServices: new Map<string, any>(),
  adminUsers: new Map<string, any>(),
  auditLogs: [] as any[],
  settings: new Map<string, any>(),
};

// Populate initial seed data in memoryStore
memoryStore.settings.set("platform_commission_percent", {
  key: "platform_commission_percent",
  value: "10",
  description: "Platform commission percent",
});

memoryStore.tours.set("samarqand-buxoro-klassik", {
  id: "tour_samarqand",
  title: "Samarqand & Buxoro Klassik Sayohatchi Turi",
  slug: "samarqand-buxoro-klassik",
  description: "Amir Temur poytaxti Samarqand va afsonaviy Buxoro bo'ylab 3 kunlik sayohat.",
  location: "Samarqand - Buxoro",
  durationDays: 3,
  basePriceUzs: 1800000,
  category: "classic",
  featured: true,
  maxPeople: 15,
  isActive: true,
  createdAt: new Date(),
  images: [{ url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80", orderIndex: 0 }],
  days: [{ dayNumber: 1, title: "Registon", description: "Registon maydoni ziyorati" }],
});

memoryStore.tours.set("xiva-orol-ekspeditsiya", {
  id: "tour_xiva",
  title: "Xiva & Qoraqalpog'iston Orol Sayohati",
  slug: "xiva-orol-ekspeditsiya",
  description: "Ichan Qal'a muzey shahri va Orol dengizi bo'ylab 4 kunlik eksklyuziv sayohat.",
  location: "Xiva - Mo'ynoq",
  durationDays: 4,
  basePriceUzs: 2900000,
  category: "adventure",
  featured: true,
  maxPeople: 8,
  isActive: true,
  createdAt: new Date(),
  images: [{ url: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1200&q=80", orderIndex: 0 }],
  days: [{ dayNumber: 1, title: "Ichan Qal'a", description: "Xiva qadimiy shahriga sayohat" }],
});

class MockPrismaClient {
  user = {
    findUnique: async ({ where }: any) => {
      for (const u of memoryStore.users.values()) {
        if (where.email && u.email === where.email) return u;
        if (where.id && u.id === where.id) return u;
      }
      return null;
    },
    create: async ({ data }: any) => {
      const user = { id: `usr_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.users.set(user.id, user);
      return user;
    },
    findMany: async () => Array.from(memoryStore.users.values()),
    count: async () => memoryStore.users.size,
  };

  tour = {
    findMany: async () => Array.from(memoryStore.tours.values()),
    findFirst: async ({ where }: any) => {
      const or = where?.OR || [];
      for (const t of memoryStore.tours.values()) {
        for (const cond of or) {
          if (cond.id && (t.id === cond.id || t.slug === cond.id)) return t;
          if (cond.slug && t.slug === cond.slug) return t;
        }
      }
      return Array.from(memoryStore.tours.values())[0] || null;
    },
    findUnique: async ({ where }: any) => {
      for (const t of memoryStore.tours.values()) {
        if (where.id && t.id === where.id) return t;
        if (where.slug && t.slug === where.slug) return t;
      }
      return null;
    },
    create: async ({ data }: any) => {
      const tour = { id: `tour_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.tours.set(tour.slug, tour);
      return tour;
    },
    upsert: async ({ create }: any) => {
      memoryStore.tours.set(create.slug, { id: `tour_${Date.now()}`, ...create, createdAt: new Date() });
      return create;
    },
    count: async () => memoryStore.tours.size,
  };

  order = {
    create: async ({ data }: any) => {
      const order = { id: `ord_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.orders.set(order.id, order);
      return order;
    },
    findUnique: async ({ where }: any) => {
      return memoryStore.orders.get(where.id) || null;
    },
    findFirst: async ({ where }: any) => {
      const or = where?.OR || [];
      for (const o of memoryStore.orders.values()) {
        for (const cond of or) {
          if (cond.id && o.id === cond.id) return o;
          if (cond.orderNumber && o.orderNumber === cond.orderNumber) return o;
        }
      }
      return null;
    },
    findMany: async () => Array.from(memoryStore.orders.values()),
    update: async ({ where, data }: any) => {
      const existing = memoryStore.orders.get(where.id);
      if (existing) Object.assign(existing, data);
      return existing;
    },
    count: async () => memoryStore.orders.size,
  };

  payment = {
    create: async ({ data }: any) => {
      const payment = { id: data.id || `pay_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.payments.set(payment.id, payment);
      return payment;
    },
    findUnique: async ({ where }: any) => {
      const p = memoryStore.payments.get(where.id);
      if (p && !p.order) {
        p.order = memoryStore.orders.get(p.orderId) || { orderNumber: "MT-2026-000123" };
      }
      return p || null;
    },
    findMany: async () => Array.from(memoryStore.payments.values()),
    update: async ({ where, data }: any) => {
      const p = memoryStore.payments.get(where.id);
      if (p) Object.assign(p, data);
      return p;
    },
  };

  paymentTransaction = {
    findUnique: async ({ where }: any) => {
      const key = `${where.provider_externalTransactionId.provider}_${where.provider_externalTransactionId.externalTransactionId}`;
      return memoryStore.paymentTransactions.get(key) || null;
    },
    create: async ({ data }: any) => {
      const key = `${data.provider}_${data.externalTransactionId}`;
      const tx = { id: `tx_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.paymentTransactions.set(key, tx);
      return tx;
    },
  };

  refund = {
    create: async ({ data }: any) => {
      const refund = { id: `ref_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.refunds.set(refund.id, refund);
      return refund;
    },
  };

  partnerEarning = {
    create: async ({ data }: any) => {
      const earning = { id: `earn_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.partnerEarnings.set(earning.id, earning);
      return earning;
    },
    findMany: async () => Array.from(memoryStore.partnerEarnings.values()),
  };

  partner = {
    create: async ({ data }: any) => {
      const p = { id: `prt_${Date.now()}`, ...data, rating: 5.0, ratingCount: 1, completedOrders: 0, createdAt: new Date() };
      memoryStore.partners.set(p.id, p);
      return p;
    },
    findFirst: async ({ where }: any) => {
      for (const p of memoryStore.partners.values()) {
        if (where.telegramId && String(p.telegramId) === String(where.telegramId)) return p;
        if (where.userId && p.userId === where.userId) return p;
      }
      return null;
    },
    findUnique: async ({ where }: any) => memoryStore.partners.get(where.id) || null,
    findMany: async () => Array.from(memoryStore.partners.values()),
    update: async ({ where, data }: any) => {
      const p = memoryStore.partners.get(where.id);
      if (p) Object.assign(p, data);
      return p;
    },
    count: async () => memoryStore.partners.size,
  };

  partnerService = {
    create: async ({ data }: any) => {
      const s = { id: `srv_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.partnerServices.set(s.id, s);
      return s;
    },
  };

  adminUser = {
    findUnique: async ({ where }: any) => {
      return memoryStore.adminUsers.get(where.username) || null;
    },
    create: async ({ data }: any) => {
      const a = { id: `adm_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.adminUsers.set(a.username, a);
      return a;
    },
    upsert: async ({ create }: any) => {
      const a = { id: `adm_${Date.now()}`, ...create, createdAt: new Date() };
      memoryStore.adminUsers.set(a.username, a);
      return a;
    },
  };

  auditLog = {
    create: async ({ data }: any) => {
      const log = { id: `log_${Date.now()}`, ...data, createdAt: new Date() };
      memoryStore.auditLogs.unshift(log);
      return log;
    },
    findMany: async () => memoryStore.auditLogs,
  };

  setting = {
    findUnique: async ({ where }: any) => memoryStore.settings.get(where.key) || null,
    upsert: async ({ create }: any) => {
      memoryStore.settings.set(create.key, create);
      return create;
    },
  };
}

let prismaClientInstance: any;

try {
  // If Prisma generated client is present in node_modules, use real PrismaClient
  const { PrismaClient } = await import("@prisma/client");
  prismaClientInstance = new PrismaClient({
    datasources: { db: { url: config.databaseUrl } },
  });
} catch {
  // Otherwise, use our full-featured in-memory Prisma client
  prismaClientInstance = new MockPrismaClient();
}

export const prisma = prismaClientInstance;
