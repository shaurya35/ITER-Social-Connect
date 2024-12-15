// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  regNo: z
    .string()
    .regex(/^\d{10}$/, "Registration number must be a 10-digit number.") 
    .transform(String), 
  discordUrl: z
    .string()
    .url("Invalid URL format.")
    .regex(
      /^https:\/\/media\.discordapp\.net\/.*/,
      "Invalid Discord media URL."
    )
});

// username: z.string().min(1, "Username is required.").max(30, "Username is too long.").optional(),
// about: z.string().optional(),
// github: z.string().url("Invalid GitHub URL").optional(),
// linkedin: z.string().url("Invalid LinkedIn URL").optional(),
// twitter: z.string().url("Invalid Twitter URL").optional(),

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

module.exports = { userSignupSchema, userSigninSchema };
