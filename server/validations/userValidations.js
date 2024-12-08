// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  regNo: z.union([z.string(), z.number()]).transform(String), 
  username: z.string().min(1, "Username is required.").max(30, "Username is too long."),
  about: z.string().optional(),
  github: z.string().url("Invalid GitHub URL").optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional(),
  twitter: z.string().url("Invalid Twitter URL").optional(),
});

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

module.exports = { userSignupSchema, userSigninSchema };
