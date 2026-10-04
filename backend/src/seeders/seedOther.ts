import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

async function main() {
  console.log('Start seeding...');

  // 1. Roles
  const roles = ['ADMIN', 'USER', 'PRODUCT_MANAGER', 'USER_MANAGER'];
  const roleIds: Record<string, string> = {};

  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
        isSystemRole: false,
      },
    });
    roleIds[roleName] = role.id;
  }
  console.log('Seeded Roles');

  // 2. Users
  const usersToCreate = [
    { email: 'admin@example.com', name: 'Admin User', roleName: 'ADMIN' },
    { email: 'product_manager@example.com', name: 'Product Manager', roleName: 'PRODUCT_MANAGER' },
    { email: 'user_manager@example.com', name: 'User Manager', roleName: 'USER_MANAGER' },
    { email: 'user@example.com', name: 'Regular User', roleName: 'USER' },
  ];

  let regularUserId = '';

  for (const u of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: await bcrypt.hash('password123', 10) // In a real scenario, this should be hashed if local login is used
      },
    });

    if (u.roleName === 'USER') {
      regularUserId = user.id;
    }

    // Associate role
    const userRoleExists = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: roleIds[u.roleName] }
    });

    if (!userRoleExists) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleIds[u.roleName]
        }
      });
    }
  }
  

  // 3. Coupons
  const coupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      code: 'WELCOME50',
      discountType: 'FLAT',
      discountValue: 50,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  });
  console.log('Seeded Coupon');

  // 4. Products provided by user
  const productIds = [
    '0cacb0a1-bc93-46c3-b826-148aeec6fa83',
    '2a236596-3bfd-4ef0-8cf8-a2fc659b2404',
    '310c2c23-dbe8-4fa1-8d25-0a8335711b8e',
    '444002d7-811e-48b6-a4bc-cf34c8a4462e',
    '69553237-9ad7-49d5-b72c-dc5322749a19',
    '7e16b840-5c71-40ed-a178-d7b2b211e5a5',
    '902688f2-c3a3-47d3-9994-7b89812e4866',
    '9f048589-20e7-4f6c-bb4b-6f48956eb58f',
    'ad73a5ac-d50a-4b98-b77b-3350232298a5',
    'd948ba10-d3d9-4b56-958f-a51fcc2d6af8',
    'da1857a5-0e6b-44bc-99a7-83989192d7d4',
    'dfab1bf7-ef77-44b4-b966-cee919ec1f9e'
  ];

  // 5. Reviews
  for (const pid of productIds) {
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: pid,
          userId: regularUserId
        }
      }
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          productId: pid,
          userId: regularUserId,
          rating: 4,
          comment: 'Great product, really liked it!',
        }
      });
    }
  }
  console.log('Seeded Reviews');

  // 6. Orders
  // Just create one dummy order with the first two products
  if (productIds.length >= 2) {
    // Check if an order already exists for this user to avoid duplicates if run multiple times
    const existingOrders = await prisma.order.findMany({
      where: { userId: regularUserId }
    });

    if (existingOrders.length === 0) {
      await prisma.order.create({
        data: {
          userId: regularUserId,
          total: 1000,
          subTotal: 1050,
          discountAmount: 50,
          couponId: coupon.id,
          couponCode: coupon.code,
          status: 'DELIVERED',
          items: {
            create: [
              { productId: productIds[0], quantity: 1 },
              { productId: productIds[1], quantity: 2 },
            ]
          }
        }
      });
      console.log('Seeded Orders');
    } else {
      console.log('Orders already seeded');
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
