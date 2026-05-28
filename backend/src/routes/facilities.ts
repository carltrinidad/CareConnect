import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import type { Facility } from '@prisma/client';

const app = new Hono();

// Get all facilities (with volunteer hours)
app.get('/', async (c) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        volunteerHours: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON fields
    const parsed = facilities.map((f: Facility) => ({
      ...f,
      amenities: JSON.parse(f.amenities),
      services: JSON.parse(f.services),
      images: JSON.parse(f.images),
    }));

    return c.json(parsed);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return c.json({ error: 'Failed to fetch facilities' }, 500);
  }
});

// Get single facility by ID
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        volunteerHours: true,
      },
    });

    if (!facility) {
      return c.json({ error: 'Facility not found' }, 404);
    }

    return c.json({
      ...facility,
      amenities: JSON.parse(facility.amenities),
      services: JSON.parse(facility.services),
      images: JSON.parse(facility.images),
    });
  } catch (error) {
    console.error('Error fetching facility:', error);
    return c.json({ error: 'Failed to fetch facility' }, 500);
  }
});

interface VolunteerHourInput {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  spotsAvailable?: number;
}

// Create facility (signup)
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      email,
      phone,
      password,
      facilityName,
      address,
      location,
      bio,
      capacity,
      amenities,
      services,
      priceRange,
      licensed,
      isHiring,
      acceptingVolunteers,
      images,
      volunteerHours,
    } = body;

    // Check if email already exists
    const existing = await prisma.facility.findUnique({ where: { email } });
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    const facility = await prisma.facility.create({
      data: {
        name,
        email,
        phone,
        password, // In production, hash this!
        facilityName,
        address,
        location,
        bio,
        capacity: capacity || 6,
        amenities: JSON.stringify(amenities || []),
        services: JSON.stringify(services || []),
        priceRange,
        licensed: licensed || false,
        isHiring: isHiring || false,
        acceptingVolunteers: acceptingVolunteers || false,
        images: JSON.stringify(images || []),
        volunteerHours: volunteerHours
          ? {
              create: volunteerHours.map((vh: VolunteerHourInput) => ({
                dayOfWeek: vh.dayOfWeek,
                startTime: vh.startTime,
                endTime: vh.endTime,
                spotsAvailable: vh.spotsAvailable || 2,
              })),
            }
          : undefined,
      },
      include: {
        volunteerHours: true,
      },
    });

    return c.json({
      ...facility,
      amenities: JSON.parse(facility.amenities),
      services: JSON.parse(facility.services),
      images: JSON.parse(facility.images),
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    return c.json({ error: 'Failed to create facility' }, 500);
  }
});

// Update facility
app.patch('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const {
      facilityName,
      address,
      location,
      bio,
      avatar,
      capacity,
      currentResidents,
      amenities,
      services,
      priceRange,
      licensed,
      isHiring,
      acceptingVolunteers,
      images,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (facilityName !== undefined) updateData.facilityName = facilityName;
    if (address !== undefined) updateData.address = address;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (currentResidents !== undefined) updateData.currentResidents = currentResidents;
    if (amenities !== undefined) updateData.amenities = JSON.stringify(amenities);
    if (services !== undefined) updateData.services = JSON.stringify(services);
    if (priceRange !== undefined) updateData.priceRange = priceRange;
    if (licensed !== undefined) updateData.licensed = licensed;
    if (isHiring !== undefined) updateData.isHiring = isHiring;
    if (acceptingVolunteers !== undefined) updateData.acceptingVolunteers = acceptingVolunteers;
    if (images !== undefined) updateData.images = JSON.stringify(images);

    const facility = await prisma.facility.update({
      where: { id },
      data: updateData,
      include: {
        volunteerHours: true,
      },
    });

    return c.json({
      ...facility,
      amenities: JSON.parse(facility.amenities),
      services: JSON.parse(facility.services),
      images: JSON.parse(facility.images),
    });
  } catch (error) {
    console.error('Error updating facility:', error);
    return c.json({ error: 'Failed to update facility' }, 500);
  }
});

// Add volunteer time slot
app.post('/:id/volunteer-hours', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { dayOfWeek, startTime, endTime, spotsAvailable } = body;

    const slot = await prisma.volunteerTimeSlot.create({
      data: {
        facilityId: id,
        dayOfWeek,
        startTime,
        endTime,
        spotsAvailable: spotsAvailable || 2,
      },
    });

    return c.json(slot);
  } catch (error) {
    console.error('Error adding volunteer hours:', error);
    return c.json({ error: 'Failed to add volunteer hours' }, 500);
  }
});

// Delete volunteer time slot
app.delete('/volunteer-hours/:slotId', async (c) => {
  try {
    const { slotId } = c.req.param();
    await prisma.volunteerTimeSlot.delete({
      where: { id: slotId },
    });
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting volunteer hours:', error);
    return c.json({ error: 'Failed to delete volunteer hours' }, 500);
  }
});

// Login facility
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    const facility = await prisma.facility.findUnique({
      where: { email },
      include: { volunteerHours: true },
    });

    if (!facility || facility.password !== password) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    return c.json({
      ...facility,
      amenities: JSON.parse(facility.amenities),
      services: JSON.parse(facility.services),
      images: JSON.parse(facility.images),
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

export default app;
