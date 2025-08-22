// user information schema
import { z } from "zod";

export const updateUserSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters long"),

  phone: z
    .string()
    .regex(/^03[0-9]{9}$/, "Phone number must be in format 03XXXXXXXXX")
    .min(11, "Phone number must be 11 digits")
    .max(11, "Phone number must be 11 digits")
    .optional(),
});
