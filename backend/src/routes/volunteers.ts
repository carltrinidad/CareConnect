import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const volunteersRouter = new Hono();

// Validation schemas
const VolunteerStatusSchema = z.enum(["pending", "approved"]);
const DaysOfWeekSchema = z.array(
  z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
);

const CreateVolunteerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  school: z.string().optional(),
  age: z.number().int().positive().optional(),
  skills: z.array(z.string()).default([]),
  bio: z.string().optional(),
  availability: DaysOfWeekSchema.default([]),
});

const UpdateVolunteerSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  skills: z.array(z.string()).optional(),
  bio: z.string().optional().nullable(),
  availability: DaysOfWeekSchema.optional(),
  status: VolunteerStatusSchema.optional(),
});

const SignupSchema = z.object({
  notes: z.string().optional(),
});

const OpportunityQuerySchema = z.object({
  date: z.string().optional(),
  skills: z.string().optional(), // comma-separated skills
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// Helper to parse JSON fields from database
function parseVolunteer(volunteer: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  school: string | null;
  age: number | null;
  skills: string;
  bio: string | null;
  availability: string;
  status: string;
  createdAt: Date;
}) {
  return {
    ...volunteer,
    skills: JSON.parse(volunteer.skills) as string[],
    availability: JSON.parse(volunteer.availability) as string[],
  };
}

function parseOpportunity(opportunity: {
  id: string;
  facilityId: string;
  facilityName: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  spotsAvailable: number;
  spotsTotal: number;
  skills: string;
  createdAt: Date;
}) {
  return {
    ...opportunity,
    skills: JSON.parse(opportunity.skills) as string[],
  };
}

// POST /volunteers - Register as a volunteer
volunteersRouter.post(
  "/",
  zValidator("json", CreateVolunteerSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      // Check if email already exists
      const existingVolunteer = await prisma.volunteer.findUnique({
        where: { email: data.email },
      });

      if (existingVolunteer) {
        return c.json(
          { error: "A volunteer with this email already exists" },
          409
        );
      }

      const volunteer = await prisma.volunteer.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          school: data.school,
          age: data.age,
          skills: JSON.stringify(data.skills),
          bio: data.bio,
          availability: JSON.stringify(data.availability),
        },
      });

      return c.json({ volunteer: parseVolunteer(volunteer) }, 201);
    } catch (error) {
      console.error("Error creating volunteer:", error);
      return c.json({ error: "Failed to create volunteer" }, 500);
    }
  }
);

// GET /opportunities - List all volunteer opportunities (can filter by date, skills)
// NOTE: This route must come before /:id to avoid conflicts
volunteersRouter.get(
  "/opportunities",
  zValidator("query", OpportunityQuerySchema),
  async (c) => {
    try {
      const { date, skills, limit, offset } = c.req.valid("query");

      const where: Record<string, unknown> = {};

      // Filter by date if provided
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        where.date = {
          gte: targetDate,
          lt: nextDay,
        };
      }

      const opportunities = await prisma.boardCareVolunteerOpportunity.findMany(
        {
          where,
          orderBy: { date: "asc" },
          take: limit,
          skip: offset,
          include: {
            _count: {
              select: {
                signups: {
                  where: {
                    status: {
                      in: ["pending", "confirmed"],
                    },
                  },
                },
              },
            },
          },
        }
      );

      // Filter by skills in JS (SQLite doesn't support JSON queries well)
      let filteredOpportunities = opportunities;
      if (skills) {
        const requiredSkills = skills.split(",").map((s: string) => s.trim().toLowerCase());
        filteredOpportunities = opportunities.filter((opp) => {
          const oppSkills = JSON.parse(opp.skills) as string[];
          return requiredSkills.some((skill: string) =>
            oppSkills.map((s) => s.toLowerCase()).includes(skill)
          );
        });
      }

      const result = filteredOpportunities.map((opp) => ({
        ...parseOpportunity(opp),
        signupCount: opp._count.signups,
      }));

      return c.json({ opportunities: result });
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      return c.json({ error: "Failed to fetch opportunities" }, 500);
    }
  }
);

// GET /opportunities/:id - Get opportunity details with volunteer count
volunteersRouter.get("/opportunities/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const opportunity = await prisma.boardCareVolunteerOpportunity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            signups: {
              where: {
                status: {
                  in: ["pending", "confirmed"],
                },
              },
            },
          },
        },
      },
    });

    if (!opportunity) {
      return c.json({ error: "Opportunity not found" }, 404);
    }

    return c.json({
      opportunity: {
        ...parseOpportunity(opportunity),
        signupCount: opportunity._count.signups,
      },
    });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return c.json({ error: "Failed to fetch opportunity" }, 500);
  }
});

// POST /opportunities/:id/signup - Sign up for an opportunity
volunteersRouter.post(
  "/opportunities/:id/signup",
  zValidator("json", SignupSchema.extend({ volunteerId: z.string().uuid() })),
  async (c) => {
    try {
      const opportunityId = c.req.param("id");
      const { volunteerId, notes } = c.req.valid("json");

      // Check if opportunity exists
      const opportunity = await prisma.boardCareVolunteerOpportunity.findUnique(
        {
          where: { id: opportunityId },
          include: {
            _count: {
              select: {
                signups: {
                  where: {
                    status: {
                      in: ["pending", "confirmed"],
                    },
                  },
                },
              },
            },
          },
        }
      );

      if (!opportunity) {
        return c.json({ error: "Opportunity not found" }, 404);
      }

      // Check if volunteer exists
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: volunteerId },
      });

      if (!volunteer) {
        return c.json({ error: "Volunteer not found" }, 404);
      }

      // Check if volunteer is approved
      if (volunteer.status !== "approved") {
        return c.json(
          { error: "Only approved volunteers can sign up for opportunities" },
          403
        );
      }

      // Check if spots are available
      if (opportunity._count.signups >= opportunity.spotsTotal) {
        return c.json(
          { error: "No spots available for this opportunity" },
          400
        );
      }

      // Check if already signed up
      const existingSignup = await prisma.volunteerSignup.findUnique({
        where: {
          volunteerId_opportunityId: {
            volunteerId,
            opportunityId,
          },
        },
      });

      if (existingSignup) {
        if (existingSignup.status === "cancelled") {
          // Re-enable the signup
          const signup = await prisma.volunteerSignup.update({
            where: { id: existingSignup.id },
            data: {
              status: "pending",
              notes,
              signedUpAt: new Date(),
            },
          });

          // Update spots available
          await prisma.boardCareVolunteerOpportunity.update({
            where: { id: opportunityId },
            data: {
              spotsAvailable: {
                decrement: 1,
              },
            },
          });

          return c.json({ signup }, 201);
        }
        return c.json(
          { error: "Already signed up for this opportunity" },
          409
        );
      }

      // Create signup
      const signup = await prisma.volunteerSignup.create({
        data: {
          volunteerId,
          opportunityId,
          notes,
        },
      });

      // Update spots available
      await prisma.boardCareVolunteerOpportunity.update({
        where: { id: opportunityId },
        data: {
          spotsAvailable: {
            decrement: 1,
          },
        },
      });

      return c.json({ signup }, 201);
    } catch (error) {
      console.error("Error signing up for opportunity:", error);
      return c.json({ error: "Failed to sign up for opportunity" }, 500);
    }
  }
);

// DELETE /signups/:id - Cancel a signup
volunteersRouter.delete("/signups/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const signup = await prisma.volunteerSignup.findUnique({
      where: { id },
    });

    if (!signup) {
      return c.json({ error: "Signup not found" }, 404);
    }

    if (signup.status === "cancelled") {
      return c.json({ error: "Signup is already cancelled" }, 400);
    }

    if (signup.status === "completed") {
      return c.json({ error: "Cannot cancel a completed signup" }, 400);
    }

    // Update signup status to cancelled
    const updatedSignup = await prisma.volunteerSignup.update({
      where: { id },
      data: { status: "cancelled" },
    });

    // Restore spots available
    await prisma.boardCareVolunteerOpportunity.update({
      where: { id: signup.opportunityId },
      data: {
        spotsAvailable: {
          increment: 1,
        },
      },
    });

    return c.json({ signup: updatedSignup });
  } catch (error) {
    console.error("Error cancelling signup:", error);
    return c.json({ error: "Failed to cancel signup" }, 500);
  }
});

// GET /volunteers/:id - Get volunteer profile
volunteersRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const volunteer = await prisma.volunteer.findUnique({
      where: { id },
    });

    if (!volunteer) {
      return c.json({ error: "Volunteer not found" }, 404);
    }

    return c.json({ volunteer: parseVolunteer(volunteer) });
  } catch (error) {
    console.error("Error fetching volunteer:", error);
    return c.json({ error: "Failed to fetch volunteer" }, 500);
  }
});

// PUT /volunteers/:id - Update volunteer profile
volunteersRouter.put(
  "/:id",
  zValidator("json", UpdateVolunteerSchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const existingVolunteer = await prisma.volunteer.findUnique({
        where: { id },
      });

      if (!existingVolunteer) {
        return c.json({ error: "Volunteer not found" }, 404);
      }

      // If email is being updated, check for uniqueness
      if (data.email && data.email !== existingVolunteer.email) {
        const emailExists = await prisma.volunteer.findUnique({
          where: { email: data.email },
        });
        if (emailExists) {
          return c.json(
            { error: "A volunteer with this email already exists" },
            409
          );
        }
      }

      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.school !== undefined) updateData.school = data.school;
      if (data.age !== undefined) updateData.age = data.age;
      if (data.skills !== undefined)
        updateData.skills = JSON.stringify(data.skills);
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.availability !== undefined)
        updateData.availability = JSON.stringify(data.availability);
      if (data.status !== undefined) updateData.status = data.status;

      const volunteer = await prisma.volunteer.update({
        where: { id },
        data: updateData,
      });

      return c.json({ volunteer: parseVolunteer(volunteer) });
    } catch (error) {
      console.error("Error updating volunteer:", error);
      return c.json({ error: "Failed to update volunteer" }, 500);
    }
  }
);

// GET /volunteers/:id/signups - Get all signups for a volunteer
volunteersRouter.get("/:id/signups", async (c) => {
  try {
    const volunteerId = c.req.param("id");

    // Check if volunteer exists
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: volunteerId },
    });

    if (!volunteer) {
      return c.json({ error: "Volunteer not found" }, 404);
    }

    const signups = await prisma.volunteerSignup.findMany({
      where: { volunteerId },
      include: {
        opportunity: true,
      },
      orderBy: { signedUpAt: "desc" },
    });

    const result = signups.map((signup) => ({
      ...signup,
      opportunity: parseOpportunity(signup.opportunity),
    }));

    return c.json({ signups: result });
  } catch (error) {
    console.error("Error fetching signups:", error);
    return c.json({ error: "Failed to fetch signups" }, 500);
  }
});

export { volunteersRouter };
