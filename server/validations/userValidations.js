// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  regNo: z.union([z.string(), z.number()]).transform(String), 
});

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

module.exports = { userSignupSchema, userSigninSchema };
