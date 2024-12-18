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

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

module.exports = { userSignupSchema, userSigninSchema };
