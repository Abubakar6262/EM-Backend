import ErrorHandler from "../utils/ErrorHandler";
import { prisma } from "../services/prisma";
import { JoinStatus, Prisma } from "@prisma/client";
import { sendEmail } from "../utils/sendMail";

export const joinEvent = async (userId: string, eventId: string) => {
  // Check if already joined
  const exists = await prisma.participant.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (exists)
    throw new ErrorHandler("You already requested to join this event", 400);

  // Create participant request
  const participant = await prisma.participant.create({
    data: {
      userId,
      eventId,
      status: JoinStatus.PENDING,
    },
    select: {
      id: true,
      userId: true,
      eventId: true,
      status: true,
    },
  });

  // Fetch extra details only for email (not returned to client)
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizers: true },
  });
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (event && user) {
    const participantName = user.fullName;
    const eventTitle = event.title;
    const organizerEmails = event.organizers.map((org) => org.email);

    for (const email of organizerEmails) {
      await sendEmail({
        to: email,
        subject: `New Join Request for ${eventTitle}`,
        text: `
Hi,

${participantName} has requested to join your event: "${eventTitle}".

Please check your dashboard to review and approve/reject this request.

Thanks,
Event Management Team
        `,
      });
    }
  }

  return participant;
};

// update participant status
export const updateParticipantStatus = async (
  userId: string,
  participantId: string,
  status: "APPROVED" | "REJECTED"
) => {
  // 1) Load participant + event + organizers for auth
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      user: true,
      event: {
        include: { organizers: true },
      },
    },
  });

  if (!participant) {
    throw new ErrorHandler("Participant request not found", 404);
  }

  // 2) Organizer authorization
  if (!participant.event.organizers.some((org) => org.id === userId)) {
    throw new ErrorHandler("Unauthorized", 403);
  }

  // 3) Idempotency: if no change needed, return current state
  if (participant.status === status) {
    return {
      id: participant.id,
      userId: participant.userId,
      eventId: participant.eventId,
      status: participant.status,
    };
  }

  // 4) Do all DB changes atomically
  const updatedParticipant = await prisma.$transaction(async (tx) => {
    // Re-read current participant and event within the transaction (fresh data)
    const p = await tx.participant.findUnique({
      where: { id: participantId },
      select: { id: true, eventId: true, status: true },
    });
    if (!p) {
      throw new ErrorHandler("Participant request not found", 404);
    }

    const ev = await tx.event.findUnique({
      where: { id: participant.event.id },
      select: { id: true, totalSeats: true },
    });
    if (!ev) {
      throw new ErrorHandler("Event not found", 404);
    }

    // If moving to APPROVED, ensure capacity before we write anything
    if (status === "APPROVED" && p.status !== "APPROVED") {
      const approvedBefore = await tx.participant.count({
        where: { eventId: ev.id, status: "APPROVED" },
      });

      if (ev.totalSeats !== null && ev.totalSeats !== undefined) {
        if (approvedBefore >= ev.totalSeats) {
          throw new ErrorHandler("Seats are already full", 400);
        }
      }
    }

    // Update participant status
    const updated = await tx.participant.update({
      where: { id: participantId },
      data: { status },
      select: { id: true, userId: true, eventId: true, status: true },
    });

    // Recalculate confirmedCount after the change to keep it perfectly in sync
    const confirmedCount = await tx.participant.count({
      where: { eventId: ev.id, status: "APPROVED" },
    });

    // Persist the recalculated count on the event
    await tx.event.update({
      where: { id: ev.id },
      data: { confirmedCount },
    });

    return updated;
  });

  // 5) Fire-and-forget email (non-blocking for API)
  const participantName = participant.user.fullName ?? "Participant";
  const participantEmail = participant.user.email;
  if (participantEmail) {
    const eventTitle = participant.event.title;
    const emailText =
      status === "APPROVED"
        ? `
Hi ${participantName},

Good news! Your request to join the event "${eventTitle}" has been approved.
You can now participate in the event.

We’re excited to have you with us!

Best regards,
Event Management Team
        `
        : `
Hi ${participantName},

We appreciate your interest in joining the event "${eventTitle}".
Unfortunately, your request has been declined by the organizer.

We hope to see you in our upcoming events! Thank you for understanding.

Best regards,
Event Management Team
        `;

    sendEmail({
      to: participantEmail,
      subject: `Your request for "${
        participant.event.title
      }" has been ${status.toLowerCase()}`,
      text: emailText,
    }).catch((err) => console.error("Failed to send email:", err));
  }

  return updatedParticipant;
};

// Delete participant request by participant
export const deleteParticipant = async (
  userId: string,
  participantId: string
) => {
  // 1. Find participant
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });

  if (!participant) {
    throw new ErrorHandler("Participant not found", 404);
  }

  // 2. Authorization → only the participant himself can cancel
  if (participant.userId !== userId) {
    throw new ErrorHandler(
      "Unauthorized: You can only cancel your own request",
      403
    );
  }

  // 3. Only allow delete if status is PENDING
  if (participant.status !== "PENDING") {
    throw new ErrorHandler("Only pending requests can be cancelled", 400);
  }

  // 4. Delete participant record
  await prisma.participant.delete({
    where: { id: participantId },
  });

  return {
    message: "Your participation request has been cancelled successfully",
  };
};

export const getMyParticipantsService = async (
  userId: string,
  page: number,
  limit: number,
  status?: "PENDING" | "APPROVED" | "REJECTED"
) => {
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.ParticipantWhereInput = { userId };
  if (status) {
    whereCondition.status = status;
  }

  const [participants, total] = await Promise.all([
    prisma.participant.findMany({
      where: whereCondition,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startAt: true,
            endAt: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.participant.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    participants,
    total,
    totalPages,
    currentPage: page,
  };
};


//get all participant that belong to a specific organizor
export const getParticipantsForOrganizerService = async (
  organizerId: string,
  page: number,
  limit: number,
  status: string
) => {
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.ParticipantWhereInput = {
    status: (status as JoinStatus) || JoinStatus.PENDING,
    event: {
      organizers: {
        some: { id: organizerId }, // only events this organizer owns
      },
    },
  };

  const [participants, total] = await Promise.all([
    prisma.participant.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        event: { select: { id: true, title: true, startAt: true, endAt: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.participant.count({ where: whereCondition }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    participants,
    total,
    totalPages,
    currentPage: page,
  };
};