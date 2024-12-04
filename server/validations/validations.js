// --- Imported zod as z ---
const { z } = require("zod");

// --- Zod signup schema ---
const userSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(3, "Password must be at least 6 characters long"),
  name: z.string().min(3, "name must have atleast 3 characters"),
});

// --- Zod login schema ---   
const userSigninSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(3, "Password must be at least 6 characters long"),
});

// --- Zod Exports ---
module.exports = { userSignupSchema, userSigninSchema };
