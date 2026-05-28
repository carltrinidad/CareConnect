import { Hono } from "hono";
import { prisma } from "../lib/prisma";

export const adminRouter = new Hono();

const ADMIN_EMAIL = "ocean3nidad@gmail.com";

// Middleware: only allow admin users
adminRouter.use("*", async (c, next) => {
  const adminEmail = c.req.header("x-admin-email");
  if (!adminEmail) return c.json({ error: "Unauthorized" }, 401);
  const user = await prisma.chatUser.findUnique({ where: { email: adminEmail } });
  if (!user?.isAdmin) return c.json({ error: "Forbidden" }, 403);
  await next();
});

// GET /api/admin/users — list all users
adminRouter.get("/users", async (c) => {
  try {
    const users = await prisma.chatUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        avatar: true,
        verified: true,
        isAdmin: true,
        createdAt: true,
      },
    });
    return c.json({ data: users });
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// PATCH /api/admin/users/:id/verify — toggle verified status
adminRouter.patch("/users/:id/verify", async (c) => {
  const id = c.req.param("id");
  try {
    const user = await prisma.chatUser.findUnique({ where: { id } });
    if (!user) return c.json({ error: "User not found" }, 404);

    const updated = await prisma.chatUser.update({
      where: { id },
      data: { verified: !user.verified },
    });
    return c.json({ data: { id: updated.id, verified: updated.verified } });
  } catch (error) {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// DELETE /api/admin/users/:id — delete a user
adminRouter.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const user = await prisma.chatUser.findUnique({ where: { id } });
    if (!user) return c.json({ error: "User not found" }, 404);
    if (user.email === ADMIN_EMAIL) return c.json({ error: "Cannot delete admin account" }, 400);

    await prisma.chatUser.delete({ where: { id } });
    return c.json({ data: { success: true } });
  } catch (error) {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

// Seed the master admin account (called on startup)
export async function seedAdminAccount() {
  const existing = await prisma.chatUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    await prisma.chatUser.create({
      data: {
        name: "Admin",
        email: ADMIN_EMAIL,
        phone: "0000000000",
        password: "Ocean#0225",
        userType: "admin",
        isAdmin: true,
        verified: true,
        metadata: "{}",
      },
    });
    console.log("✅ Admin account created for", ADMIN_EMAIL);
  } else if (!existing.isAdmin) {
    await prisma.chatUser.update({ where: { email: ADMIN_EMAIL }, data: { isAdmin: true, verified: true } });
    console.log("✅ Admin privileges granted to", ADMIN_EMAIL);
  }
}
