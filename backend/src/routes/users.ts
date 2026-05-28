import { Hono } from "hono";
import { prisma } from "../lib/prisma";

export const usersRouter = new Hono();

// Register a new user (any type)
usersRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, email, phone, password, userType, avatar, bio, location } = body;

  if (!name || !email || !phone || !password || !userType) {
    return c.json({ error: "name, email, phone, password, and userType are required" }, 400);
  }

  const validTypes = ["elderly", "caregiver", "facility", "volunteer"];
  if (!validTypes.includes(userType)) {
    return c.json({ error: "Invalid userType" }, 400);
  }

  try {
    // Check if email already exists
    const existing = await prisma.chatUser.findUnique({ where: { email } });
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const user = await prisma.chatUser.create({
      data: {
        name,
        email,
        phone,
        password,
        userType,
        avatar: avatar || null,
        bio: bio || null,
        location: location || null,
      },
    });

    return c.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return c.json({ error: "Failed to register user" }, 500);
  }
});

// Login - supports email or phone, checks both ChatUser and Facility tables
usersRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, phone, password } = body;

  if ((!email && !phone) || !password) {
    return c.json({ error: "email or phone, and password are required" }, 400);
  }

  try {
    // First check ChatUser table by email or phone
    let user = null;
    if (email) {
      user = await prisma.chatUser.findUnique({ where: { email } });
    }
    if (!user && phone) {
      // Strip non-digits for phone comparison
      const digits = phone.replace(/\D/g, "");
      const chatUsers = await prisma.chatUser.findMany();
      user = chatUsers.find((u) => u.phone.replace(/\D/g, "") === digits) || null;
    }

    if (user && user.password === password) {
      // Check if this is a facility user - if so, also return facility data
      if (user.userType === "facility") {
        const facility = await prisma.facility.findUnique({
          where: { email: user.email },
          include: { volunteerHours: true },
        });
        if (facility) {
          return c.json({
            data: {
              id: facility.id,
              name: facility.name,
              email: facility.email,
              phone: facility.phone,
              userType: "facility",
              facilityName: facility.facilityName,
              address: facility.address,
              location: facility.location,
              bio: facility.bio,
              avatar: facility.avatar,
              capacity: facility.capacity,
              currentResidents: facility.currentResidents,
              amenities: JSON.parse(facility.amenities),
              services: JSON.parse(facility.services),
              priceRange: facility.priceRange,
              rating: facility.rating,
              reviewCount: facility.reviewCount,
              images: JSON.parse(facility.images),
              licensed: facility.licensed,
              isHiring: facility.isHiring,
              volunteerHours: facility.volunteerHours,
            },
          });
        }
      }

      return c.json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType: user.userType,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location,
          metadata: user.metadata ?? "{}",
          isAdmin: user.isAdmin,
          verified: user.verified,
        },
      });
    }

    // If not found in ChatUser, check Facility table directly
    let facility = null;
    if (email) {
      facility = await prisma.facility.findUnique({
        where: { email },
        include: { volunteerHours: true },
      });
    }
    if (!facility && phone) {
      const digits = phone.replace(/\D/g, "");
      const facilities = await prisma.facility.findMany({ include: { volunteerHours: true } });
      facility = facilities.find((f) => f.phone.replace(/\D/g, "") === digits) || null;
    }

    if (facility && facility.password === password) {
      return c.json({
        data: {
          id: facility.id,
          name: facility.name,
          email: facility.email,
          phone: facility.phone,
          userType: "facility",
          facilityName: facility.facilityName,
          address: facility.address,
          location: facility.location,
          bio: facility.bio,
          avatar: facility.avatar,
          capacity: facility.capacity,
          currentResidents: facility.currentResidents,
          amenities: JSON.parse(facility.amenities),
          services: JSON.parse(facility.services),
          priceRange: facility.priceRange,
          rating: facility.rating,
          reviewCount: facility.reviewCount,
          images: JSON.parse(facility.images),
          licensed: facility.licensed,
          isHiring: facility.isHiring,
          volunteerHours: facility.volunteerHours,
        },
      });
    }

    return c.json({ error: "Invalid credentials" }, 401);
  } catch (error) {
    console.error("Error logging in:", error);
    return c.json({ error: "Failed to login" }, 500);
  }
});

// Lookup user by ID
usersRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const user = await prisma.chatUser.findUnique({ where: { id } });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        metadata: user.metadata ?? "{}",
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Update user profile
usersRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, email, phone, location, bio, avatar, metadata } = body;

  try {
    const user = await prisma.chatUser.findUnique({ where: { id } });
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const updated = await prisma.chatUser.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    return c.json({
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        userType: updated.userType,
        avatar: updated.avatar,
        bio: updated.bio,
        location: updated.location,
        metadata: updated.metadata ?? "{}",
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});
