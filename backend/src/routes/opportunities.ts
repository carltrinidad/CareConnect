import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { prisma } from "../lib/prisma";

const opportunitiesRouter = new Hono();

// Validation schemas
const CreateOpportunitySchema = z.object({
  facilityId: z.string().min(1, "Facility ID is required"),
  facilityName: z.string().min(1, "Facility name is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().transform((val) => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  spotsTotal: z.number().int().positive("Spots must be a positive integer"),
  skills: z.array(z.string()).default([]),
});

const UpdateOpportunitySchema = z.object({
  facilityId: z.string().min(1, "Facility ID is required").optional(),
  facilityName: z.string().min(1, "Facility name is required").optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  date: z.string().transform((val) => new Date(val)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
  spotsTotal: z.number().int().positive("Spots must be a positive integer").optional(),
  skills: z.array(z.string()).optional(),
});

// Helper to parse JSON fields from database
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

// POST /opportunities - Create new opportunity (for facilities)
opportunitiesRouter.post(
  "/",
  zValidator("json", CreateOpportunitySchema),
  async (c) => {
    try {
      const data = c.req.valid("json");

      const opportunity = await prisma.boardCareVolunteerOpportunity.create({
        data: {
          facilityId: data.facilityId,
          facilityName: data.facilityName,
          title: data.title,
          description: data.description,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          spotsAvailable: data.spotsTotal,
          spotsTotal: data.spotsTotal,
          skills: JSON.stringify(data.skills),
        },
      });

      return c.json({ opportunity: parseOpportunity(opportunity) }, 201);
    } catch (error) {
      console.error("Error creating opportunity:", error);
      return c.json({ error: "Failed to create opportunity" }, 500);
    }
  }
);

// PUT /opportunities/:id - Update opportunity
opportunitiesRouter.put(
  "/:id",
  zValidator("json", UpdateOpportunitySchema),
  async (c) => {
    try {
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const existingOpportunity =
        await prisma.boardCareVolunteerOpportunity.findUnique({
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

      if (!existingOpportunity) {
        return c.json({ error: "Opportunity not found" }, 404);
      }

      const updateData: Record<string, unknown> = {};
      if (data.facilityId !== undefined) updateData.facilityId = data.facilityId;
      if (data.facilityName !== undefined) updateData.facilityName = data.facilityName;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.startTime !== undefined) updateData.startTime = data.startTime;
      if (data.endTime !== undefined) updateData.endTime = data.endTime;
      if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);

      // Handle spotsTotal update - also update spotsAvailable accordingly
      if (data.spotsTotal !== undefined) {
        const currentSignups = existingOpportunity._count.signups;
        if (data.spotsTotal < currentSignups) {
          return c.json(
            {
              error: `Cannot reduce spots below current signup count (${currentSignups})`,
            },
            400
          );
        }
        updateData.spotsTotal = data.spotsTotal;
        updateData.spotsAvailable = data.spotsTotal - currentSignups;
      }

      const opportunity = await prisma.boardCareVolunteerOpportunity.update({
        where: { id },
        data: updateData,
      });

      return c.json({ opportunity: parseOpportunity(opportunity) });
    } catch (error) {
      console.error("Error updating opportunity:", error);
      return c.json({ error: "Failed to update opportunity" }, 500);
    }
  }
);

// DELETE /opportunities/:id - Delete opportunity
opportunitiesRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const existingOpportunity =
      await prisma.boardCareVolunteerOpportunity.findUnique({
        where: { id },
      });

    if (!existingOpportunity) {
      return c.json({ error: "Opportunity not found" }, 404);
    }

    // Delete will cascade to signups due to onDelete: Cascade in schema
    await prisma.boardCareVolunteerOpportunity.delete({
      where: { id },
    });

    return c.json({ message: "Opportunity deleted successfully" });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    return c.json({ error: "Failed to delete opportunity" }, 500);
  }
});

// GET /opportunities/:id/volunteers - Get list of signed up volunteers
opportunitiesRouter.get("/:id/volunteers", async (c) => {
  try {
    const id = c.req.param("id");

    const opportunity = await prisma.boardCareVolunteerOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return c.json({ error: "Opportunity not found" }, 404);
    }

    const signups = await prisma.volunteerSignup.findMany({
      where: {
        opportunityId: id,
        status: {
          in: ["pending", "confirmed", "completed"],
        },
      },
      include: {
        volunteer: true,
      },
      orderBy: { signedUpAt: "asc" },
    });

    const volunteers = signups.map((signup) => ({
      signupId: signup.id,
      signupStatus: signup.status,
      signedUpAt: signup.signedUpAt,
      notes: signup.notes,
      volunteer: parseVolunteer(signup.volunteer),
    }));

    return c.json({
      opportunity: parseOpportunity(opportunity),
      volunteers,
      totalSignups: volunteers.length,
    });
  } catch (error) {
    console.error("Error fetching opportunity volunteers:", error);
    return c.json({ error: "Failed to fetch opportunity volunteers" }, 500);
  }
});

export { opportunitiesRouter };
