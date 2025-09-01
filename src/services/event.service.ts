import { EventType, Prisma } from "@prisma/client";
import { prisma } from "../services/prisma";
import { deleteImageFromCloudinary } from "../utils/deleteImageFromCloudinary";

interface HostInput {
  name: string;
  email?: string;
  phone?: string;
  userId?: string;
}

interface CreateEventInput {
  userId: string;
  data: {
    title: string;
    description: string;
    hosts?: HostInput[];
    totalSeats?: number | null;
    type: EventType;
    venue?: string;
    joinLink?: string;
    startAt: string;
    endAt: string;
    contactInfo?: string;
    thumbnail: string; // required
  };
  files?: Record<string, Express.Multer.File[]>;
}

interface UpdateEventInput {
  eventId: string;
  userId: string;
  data: {
    title?: string;
    description?: string;
    hosts?: HostInput[];
    totalSeats?: number;
    type?: string;
    venue?: string;
    joinLink?: string;
    startAt?: string;
    endAt?: string;
    contactInfo?: string;
    thumbnail?: string;
  };
  files?: Record<string, Express.Multer.File[]>;
}

// Create Event Service
export const createEventService = async ({
  userId,
  data,
  files,
}: CreateEventInput) => {
  const {
    title,
    description,
    hosts,
    totalSeats,
    type,
    venue,
    joinLink,
    startAt,
    endAt,
    contactInfo,
    thumbnail,
  } = data;

  // Create Event
  const event = await prisma.event.create({
    data: {
      title,
      description,
      totalSeats: totalSeats ?? null,
      type,
      venue,
      joinLink,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      contactInfo: contactInfo || "",
      thumbnail,
      organizers: {
        connect: { id: userId },
      },
    },
    include: {
      hosts: true,
      organizers: true,
    },
  });

  // Add hosts
  if (hosts && hosts.length > 0) {
    for (const host of hosts) {
      let hostRecord = await prisma.host.findUnique({
        where: { email: host.email ?? "" },
      });

      if (!hostRecord) {
        hostRecord = await prisma.host.create({
          data: {
            name: host.name,
            email: host.email || null,
            phone: host.phone || null,
            userId: host.userId || null,
          },
        });
      }

      await prisma.event.update({
        where: { id: event.id },
        data: {
          hosts: { connect: { id: hostRecord.id } },
        },
      });
    }
  }

  // Handle media attachments
  const mediaFiles = files?.["media"] || [];
  if (mediaFiles.length > 0) {
    const attachments = mediaFiles.map((file: Express.Multer.File) => ({
      url: file.path,
      type: file.mimetype.split("/")[0],
      eventId: event.id,
    }));

    await prisma.attachment.createMany({ data: attachments });
  }

  // Return complete event with relations
  return prisma.event.findUnique({
    where: { id: event.id },
    include: {
      hosts: true,
      organizers: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      },
      attachments: true,
    },
  });
};

// Update Event Service
// export const updateEventByIdService = async ({
//   eventId,
//   userId,
//   data,
//   files,
// }: UpdateEventInput) => {
//   // Update event fields
//   await prisma.event.update({
//     where: {
//       id: eventId,
//       organizers: { some: { id: userId } },
//     },
//     data: {
//       ...(data.title && { title: data.title }),
//       ...(data.description && { description: data.description }),
//       ...(data.totalSeats !== undefined && { totalSeats: data.totalSeats }),
//       ...(data.type && { type: data.type as EventType }),
//       ...(data.venue && { venue: data.venue }),
//       ...(data.joinLink && { joinLink: data.joinLink }),
//       ...(data.startAt && { startAt: new Date(data.startAt) }),
//       ...(data.endAt && { endAt: new Date(data.endAt) }),
//       ...(data.contactInfo && { contactInfo: data.contactInfo }),
//       ...(data.thumbnail && { thumbnail: data.thumbnail }),
//     },
//   });

//   // Handle hosts
//   if (data.hosts && data.hosts.length > 0) {
//     for (const host of data.hosts) {
//       let hostRecord = await prisma.host.findUnique({
//         where: { email: host.email ?? "" },
//       });

//       if (!hostRecord) {
//         hostRecord = await prisma.host.create({
//           data: {
//             name: host.name,
//             email: host.email || null,
//             phone: host.phone || null,
//             userId: host.userId || null,
//           },
//         });
//       }

//       await prisma.event.update({
//         where: { id: eventId },
//         data: { hosts: { connect: { id: hostRecord.id } } },
//       });
//     }
//   }

//   // Handle attachments
//   const mediaFiles = files?.["media"] || [];
//   if (mediaFiles.length > 0) {
//     const attachments = mediaFiles.map((file: Express.Multer.File) => ({
//       url: file.path,
//       type: file.mimetype.split("/")[0],
//       eventId: eventId,
//     }));

//     await prisma.attachment.createMany({ data: attachments });
//   }

//   // Refetch event to include new attachments & hosts
//   const updatedEvent = await prisma.event.findUnique({
//     where: { id: eventId },
//     include: {
//       hosts: true,
//       organizers: { select: { id: true, email: true, fullName: true } },
//       attachments: true,
//     },
//   });

//   return updatedEvent;
// };

export const updateEventByIdService = async ({
  eventId,
  userId,
  data,
  files,
}: UpdateEventInput) => {
  // Prepare update payload
  const updatePayload: any = {
    ...(data.title && { title: data.title }),
    ...(data.description && { description: data.description }),
    ...(data.totalSeats !== undefined && { totalSeats: data.totalSeats }),
    ...(data.type && { type: data.type as EventType }),
    ...(data.venue && { venue: data.venue }),
    ...(data.joinLink && { joinLink: data.joinLink }),
    ...(data.startAt && { startAt: new Date(data.startAt) }),
    ...(data.endAt && { endAt: new Date(data.endAt) }),
    ...(data.contactInfo && { contactInfo: data.contactInfo }),
  };

  //  Handle thumbnail update (only if new file uploaded)
  const thumbnailFile = files?.["thumbnail"]?.[0];
  if (thumbnailFile) {
    updatePayload.thumbnail = thumbnailFile.path; // store uploaded file path
  }

  // Update event
  await prisma.event.update({
    where: {
      id: eventId,
      organizers: { some: { id: userId } },
    },
    data: updatePayload,
  });

  //  Handle hosts (replace instead of only connect)
  if (data.hosts) {
    // Clear old hosts
    await prisma.event.update({
      where: { id: eventId },
      data: { hosts: { set: [] } },
    });

    for (const host of data.hosts) {
      let hostRecord = await prisma.host.findUnique({
        where: { email: host.email ?? "" },
      });

      if (!hostRecord) {
        hostRecord = await prisma.host.create({
          data: {
            name: host.name,
            email: host.email || null,
            phone: host.phone || null,
            userId: host.userId || null,
          },
        });
      }

      await prisma.event.update({
        where: { id: eventId },
        data: { hosts: { connect: { id: hostRecord.id } } },
      });
    }
  }

  // Handle attachments
    const mediaFiles = files?.["media"] || [];
    if (mediaFiles.length > 0) {
      const attachments = mediaFiles.map((file: Express.Multer.File) => ({
        url: file.path,
        type: file.mimetype.split("/")[0],
        eventId: eventId,
      }));

      await prisma.attachment.createMany({ data: attachments });
    }

  // Return full updated event
  const updatedEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      hosts: true,
      organizers: { select: { id: true, email: true, fullName: true } },
      attachments: true,
    },
  });

  return updatedEvent;
};


// Get all events service
export const getAllEventsService = async (
  page: number,
  limit: number,
  filterBy?: string,
  search?: string,
  type?: EventType
) => {
  const now = new Date();

  let where: Prisma.EventWhereInput = { isDeleted: false };
  let orderBy: Prisma.EventOrderByWithRelationInput = { startAt: "asc" };

  // 🔹 Apply filterBy
  switch (filterBy?.toLowerCase()) {
    case "incoming":
      where = { ...where, startAt: { gt: now } };
      orderBy = { startAt: "asc" };
      break;
    case "past":
      where = { ...where, endAt: { lt: now } };
      orderBy = { startAt: "desc" };
      break;
    case "live":
      where = { ...where, startAt: { lte: now }, endAt: { gte: now } };
      orderBy = { endAt: "asc" };
      break;
  }

  //  Apply search by title
  if (search) {
    where = {
      ...where,
      title: {
        contains: search,
        mode: "insensitive",
      },
    };
  }

  //  Apply type filter
  if (type) {
    where = {
      ...where,
      type: type,
    };
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      include: {
        hosts: true,
        participants: true,
        organizers: {
          select: { id: true, fullName: true, email: true },
        },
        attachments: true,
      },
      orderBy,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
};


// Get event by ID service
export const getEventByIdService = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId, isDeleted: false },
    include: {
      hosts: true,
      participants: true,
      organizers: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      attachments: true,
    },
  });

  return event;
};

// Delete Event Service
export const deleteEventByIdService = async (
  eventId: string,
  userId: string
) => {
  // Check if event exists and belongs to organizer
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizers: { select: { id: true } } },
  });

  if (!event) {
    return null; // event not found
  }

  const isOrganizer = event.organizers.some((org) => org.id === userId);
  if (!isOrganizer) {
    throw new Error("Unauthorized"); // will be handled in controller
  }

  // Delete all participants permanently
  await prisma.participant.deleteMany({
    where: { eventId },
  });

  // Soft delete the event
  await prisma.event.update({
    where: { id: eventId },
    data: { isDeleted: true },
  });

  return true;
};


// Get my Events
export const getMyEventsService = async (
  userId: string,
  page: number,
  limit: number,
  filterBy?: string,
  search?: string,
  type?: EventType // Added here
) => {
  const now = new Date();

  let where: Prisma.EventWhereInput = {
    isDeleted: false,
    organizers: { some: { id: userId } },
  };
  let orderBy: Prisma.EventOrderByWithRelationInput = { startAt: "asc" };

  // 🔹 Apply status filter
  switch (filterBy?.toLowerCase()) {
    case "incoming":
      where = { ...where, startAt: { gt: now } };
      orderBy = { startAt: "asc" };
      break;
    case "past":
      where = { ...where, endAt: { lt: now } };
      orderBy = { startAt: "desc" };
      break;
    case "live":
      where = { ...where, startAt: { lte: now }, endAt: { gte: now } };
      orderBy = { endAt: "asc" };
      break;
  }

  // 🔹 Apply search by title
  if (search) {
    where = {
      ...where,
      title: {
        contains: search,
        mode: "insensitive",
      },
    };
  }

  // 🔹 Apply filter by type
  if (type) {
    where = {
      ...where,
      type, // Assuming 'type' matches the EventType field in Prisma
    };
  }

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      include: {
        hosts: true,
        organizers: {
          select: { id: true, fullName: true, email: true },
        },
        attachments: true,
      },
      orderBy,
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total };
};

// Delete attachment
export const deleteAttachmentByIdService = async (
  attachmentId: string,
  userId: string
) => {
  // Check if attachment exists
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    return null; // attachment not found
  }

  // Check if user is authorized to delete
  const event = await prisma.event.findUnique({
    where: { id: attachment.eventId },
    include: { organizers: { select: { id: true } } },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  const isOrganizer = event.organizers.some((org) => org.id === userId);
  if (!isOrganizer) {
    throw new Error("Unauthorized"); // will be handled in controller
  }

  // Delete attachment
  await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  //   delete attachment from cloudinary
  await deleteImageFromCloudinary(attachment.url);
  return true;
};

export const getOrganizerDashboardService = async (userId: string) => {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // --- Basic counts ---
  const [
    totalEvents,
    incomingEvents,
    pastEvents,
    ongoingEvents,
    cancelledEvents,
  ] = await Promise.all([
    prisma.event.count({
      where: { isDeleted: false, organizers: { some: { id: userId } } },
    }),
    prisma.event.count({
      where: {
        isDeleted: false,
        organizers: { some: { id: userId } },
        startAt: { gt: now },
      },
    }),
    prisma.event.count({
      where: {
        isDeleted: false,
        organizers: { some: { id: userId } },
        endAt: { lt: now },
      },
    }),
    prisma.event.count({
      where: {
        isDeleted: false,
        organizers: { some: { id: userId } },
        startAt: { lte: now },
        endAt: { gte: now },
      },
    }),
    prisma.event.count({
      where: {
        isDeleted: false,
        organizers: { some: { id: userId } },
        status: "CANCELLED",
      },
    }),
  ]);

  // --- Participants ---
  const totalParticipants = await prisma.participant.count({
    where: {
      event: { isDeleted: false, organizers: { some: { id: userId } } },
      status: "APPROVED",
    },
  });

  const pendingJoinRequests = await prisma.participant.count({
    where: {
      event: { isDeleted: false, organizers: { some: { id: userId } } },
      status: "PENDING",
    },
  });

  const approvedRequests = await prisma.participant.count({
    where: {
      event: { isDeleted: false, organizers: { some: { id: userId } } },
      status: "APPROVED",
    },
  });

  const rejectedRequests = await prisma.participant.count({
    where: {
      event: { isDeleted: false, organizers: { some: { id: userId } } },
      status: "REJECTED",
    },
  });

  const approvalRate =
    approvedRequests + rejectedRequests > 0
      ? approvedRequests / (approvedRequests + rejectedRequests)
      : 0;

  // --- Average seats filled ---
  const eventsWithSeats = await prisma.event.findMany({
    where: {
      isDeleted: false,
      organizers: { some: { id: userId } },
      totalSeats: { not: null },
    },
    select: { confirmedCount: true, totalSeats: true },
  });

  const averageSeatsFilled =
    eventsWithSeats.length > 0
      ? eventsWithSeats.reduce(
          (acc, e) => acc + e.confirmedCount / (e.totalSeats || 1),
          0
        ) / eventsWithSeats.length
      : 0;

  // --- Most popular event ---
  const mostPopular = await prisma.event.findFirst({
    where: { isDeleted: false, organizers: { some: { id: userId } } },
    orderBy: { participants: { _count: "desc" } },
    select: {
      id: true,
      title: true,
      _count: { select: { participants: true } },
    },
  });

  // --- Online vs Onsite ratio ---
  const [onlineCount, onsiteCount] = await Promise.all([
    prisma.event.count({
      where: {
        isDeleted: false,
        organizers: { some: { id: userId } },
        type: "ONLINE",
      },
    }),
    prisma.event.count({
      where: {
        isDeleted: false,
        organizers: { some: { id: userId } },
        type: "ONSITE",
      },
    }),
  ]);

  // --- Events created last 30 days ---
  const eventsLast30Days = await prisma.event.findMany({
    where: {
      isDeleted: false,
      organizers: { some: { id: userId } },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
  });

  const dailyCounts: Record<string, number> = {};
  for (const e of eventsLast30Days) {
    const dateKey = e.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  }

  return {
    totalEvents,
    incomingEvents,
    pastEvents,
    ongoingEvents,
    cancelledEvents,
    totalParticipants,
    averageSeatsFilled: Number(averageSeatsFilled.toFixed(2)),
    mostPopularEvent: mostPopular
      ? {
          id: mostPopular.id,
          title: mostPopular.title,
          participantsCount: mostPopular._count.participants,
        }
      : null,
    pendingJoinRequests,
    approvalRate: Number(approvalRate.toFixed(2)),
    onlineVsOnsite: { ONLINE: onlineCount, ONSITE: onsiteCount },
    eventsLast30Days: dailyCounts,
  };
};