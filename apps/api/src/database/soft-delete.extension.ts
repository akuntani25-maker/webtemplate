import { Prisma } from '@prisma/client';

/**
 * Model yang menerapkan soft delete (punya kolom `deletedAt`).
 */
const SOFT_DELETE_MODELS = new Set<string>([
  'User',
  'Address',
  'Category',
  'Product',
  'ProductFile',
  'Coupon',
  'Order',
  'Invoice',
  'PaymentProof',
  'Review',
  'BlogPost',
  'BlogComment',
  'Banner',
  'Testimonial',
  'Faq',
]);

/**
 * Prisma Client Extension untuk soft delete:
 *  - `delete`/`deleteMany` → update `deletedAt = now()`
 *  - `find*`/`count`/`aggregate` → sisipkan filter `deletedAt: null`
 *
 * Untuk mengakses record terhapus, gunakan query dengan `deletedAt` eksplisit,
 * atau method `$allRecords` (raw) sesuai kebutuhan admin.
 */
export function softDeleteExtension(client: any) {
  return client.$extends({
    name: 'soft-delete',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || !SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          // Ubah delete menjadi soft delete
          if (operation === 'delete') {
            return (client as any)[lowerFirst(model)].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          if (operation === 'deleteMany') {
            return (client as any)[lowerFirst(model)].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          }

          // Sisipkan filter deletedAt: null pada operasi baca
          const READ_OPS = [
            'findFirst',
            'findFirstOrThrow',
            'findMany',
            'findUnique',
            'findUniqueOrThrow',
            'count',
            'aggregate',
          ];
          if (READ_OPS.includes(operation)) {
            args.where = args.where ?? {};
            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null;
            }
          }

          return query(args);
        },
      },
    },
  });
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export type ExtendedPrismaClient = ReturnType<typeof softDeleteExtension>;
