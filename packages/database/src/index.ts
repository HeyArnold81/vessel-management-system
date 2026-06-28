import { PrismaClient } from '@prisma/client';

declare global {
  var vmsPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.vmsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.vmsPrisma = prisma;
}

export { Prisma } from '@prisma/client';
