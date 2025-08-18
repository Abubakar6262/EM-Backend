import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  hosts: z.array(z.string()).optional(),
  totalSeats: z.number().int().positive().optional(),
  type: z.enum(["onsite", "online"]),
  venue: z.string().optional(),
  joinLink: z.string().url().optional(),
  startAt: z.string(),
  endAt: z.string(),
  contactInfo: z.string().min(3),
  organizerIds: z.array(z.string()).optional(),
});
