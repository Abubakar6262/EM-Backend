import ErrorHandler from "../utils/ErrorHandler";
import { prisma } from "../services/prisma";
import { JoinStatus } from "@prisma/client";
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
  // Check if user is authorized to update this participant
  // Check participant request exists
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      user: true,
      event: {
        include: {
          organizers: true,
        },
      },
    },
  });
  if (!participant) {
    throw new ErrorHandler("Participant request not found", 404);
  }

  if (!participant?.event?.organizers.some((org) => org.id === userId)) {
    throw new ErrorHandler("Unauthorized", 403);
  }


  // Update status
  const updatedParticipant = await prisma.participant.update({
    where: { id: participantId },
    data: { status: status as JoinStatus },
    select: {
      id: true,
      userId: true,
      eventId: true,
      status: true,
    },
  });

  // Send email to participant
  const participantName = participant.user.fullName;
  const eventTitle = participant.event.title;
  const participantEmail = participant.user.email;

  let emailText = "";

  if (status === "APPROVED") {
    emailText = `
Hi ${participantName},

Good news! 🎉 Your request to join the event "${eventTitle}" has been approved.  
You can now participate in the event.

We’re excited to have you with us!

Best regards,  
Event Management Team
    `;
  } else {
    emailText = `
Hi ${participantName},

We appreciate your interest in joining the event "${eventTitle}".  
Unfortunately, your request has been declined by the organizer.  

We hope to see you in our upcoming events! Thank you for understanding.

Best regards,  
Event Management Team
    `;
  }

  await sendEmail({
    to: participantEmail,
    subject: `Your request for "${eventTitle}" has been ${status.toLowerCase()}`,
    text: emailText,
  });

  return updatedParticipant;
};
