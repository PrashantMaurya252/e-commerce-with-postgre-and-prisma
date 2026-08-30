import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { AuthProvider } from "@prisma/client";

const permissions = [
  {
    name: "USER_CREATE",
    resource: "USER",
    action: "CREATE",
  },
  {
    name: "USER_READ",
    resource: "USER",
    action: "READ",
  },
  {
    name: "USER_UPDATE",
    resource: "USER",
    action: "UPDATE",
  },
  {
    name: "USER_DELETE",
    resource: "USER",
    action: "DELETE",
  },
  {
    name: "PRODUCT_CREATE",
    resource: "PRODUCT",
    action: "CREATE",
  },
  {
    name: "PRODUCT_READ",
    resource: "PRODUCT",
    action: "READ",
  },
  {
    name: "PRODUCT_UPDATE",
    resource: "PRODUCT",
    action: "UPDATE",
  },
  {
    name: "PRODUCT_DELETE",
    resource: "PRODUCT",
    action: "DELETE",
  },
  {
    name: "QUEUE_READ",
    resource: "QUEUE",
    action: "READ",
  },
  {
    name: "QUEUE_MANAGE",
    resource: "QUEUE",
    action: "MANAGE",
  },
];

async function seedPermissions() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        name: permission.name,
      },

      update: {
        resource: permission.resource,
        action: permission.action,
      },

      create: {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
      },
    });
  }

  console.log("Permissions seeded successfully");
}

async function seedAdminRole() {
  // 1. Create SUPER_ADMIN role
  const superAdminRole = await prisma.role.upsert({
    where: {
      name: "super_admin",
    },

    update: {},

    create: {
      name: "super_admin",
      description: "All permissions granted",
      isSystemRole: true
    },
  });

  // 2. Get all permissions
  const allPermissions = await prisma.permission.findMany({
    select: {
      id: true,
    },
  });

  // 3. Assign all permissions to SUPER_ADMIN
  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: superAdminRole.id,
      permissionId: permission.id,
    })),

    skipDuplicates: true,
  });

  console.log("Super admin permissions assigned");

  // 4. Validate environment variables
  if (!process.env.SUPER_ADMIN_EMAIL) {
    throw new Error("SUPER_ADMIN_EMAIL is not defined");
  }

  if (!process.env.SUPER_ADMIN_PASSWORD) {
    throw new Error("SUPER_ADMIN_PASSWORD is not defined");
  }

  // 5. Hash password
  const hashedPassword = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD,
    12
  );

  // 6. Create SUPER_ADMIN user
  const adminUser = await prisma.user.upsert({
    where: {
      email: process.env.SUPER_ADMIN_EMAIL,
    },

    update: {

    },

    create: {
      name: "Super Admin",
      email: process.env.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
      isVerified: true,

      userRoles: {
        create: {
          roleId: superAdminRole.id,

        },
      },
    },
  });

  console.log(`Super admin user seeded: ${adminUser.email}`);
}

async function seeder() {
  try {
    await seedPermissions();
    await seedAdminRole();

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seeder();