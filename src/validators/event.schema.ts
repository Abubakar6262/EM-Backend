import { EventType } from "@prisma/client";
import { z } from "zod";

// Base schema (pure object)
const baseEventSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(3, "Title must be at least 3 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters"),
  type: z.nativeEnum(EventType, {
    errorMap: () => ({ message: "Type must be ONLINE or ONSITE" }),
  }),
  contactInfo: z
    .string({ required_error: "Contact info is required" })
    .min(3, "Contact info must be at least 3 characters"),
  thumbnail: z.string({
    required_error: "Thumbnail is required",
    invalid_type_error: "Thumbnail must be a string (file path/url)",
  }),
  totalSeats: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) =>
      val !== undefined && val !== null
        ? typeof val === "string"
          ? parseInt(val, 10)
          : val
        : undefined
    ),
  venue: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  joinLink: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  startAt: z
    .string({ required_error: "Start date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    }),
  endAt: z
    .string({ required_error: "End date is required" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  hosts: z
    .union([
      z.string({ required_error: "Hosts are required" }).transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }),
      z.array(
        z.object({
          name: z.string().min(2, "Host name must be at least 2 characters"),
          email: z.string().email("Invalid email").optional(),
          phone: z.string().optional(),
          userId: z.string().uuid("Invalid userId").optional(),
        })
      ),
    ])
    .optional(),
  organizerIds: z
    .union([
      z.string().transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }),
      z.array(z.string().uuid("Invalid organizer id")),
    ])
    .optional(),
});

// Full schema for creation (with refinements)
export const createEventSchema = baseEventSchema
  .refine((data) => (data.type === "ONSITE" ? !!data.venue : true), {
    message: "Venue is required for onsite events",
    path: ["venue"],
  })
  .refine(
    (data) => {
      if (data.type === "ONLINE") {
        if (!data.joinLink) return false; // required for ONLINE
        try {
          new URL(data.joinLink); // must be absolute URL
          return true;
        } catch {
          return false;
        }
      }
      return true; // skip validation for ONSITE
    },
    { message: "Join link must be a valid URL", path: ["joinLink"] }
  )
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End date must be after start date",
    path: ["endAt"],
  });

// Update schema → partial but required for some fields if provided
export const updateEventSchema = baseEventSchema
  .partial()
  .refine(
    (data) =>
      data.type === "ONSITE" ? !!data.venue || data.venue === undefined : true,
    { message: "Venue is required for onsite events", path: ["venue"] }
  )
  .refine(
    (data) => {
      if (data.type === "ONLINE") {
        if (data.joinLink === undefined) return true; // skip if not updating joinLink
        try {
          new URL(data.joinLink);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    { message: "Join link must be a valid URL", path: ["joinLink"] }
  )
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
      }
      return true; // skip if not both provided
    },
    { message: "End date must be after start date", path: ["endAt"] }
  );
