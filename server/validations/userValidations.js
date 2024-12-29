// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  // .regex(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  //   "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
  // ),
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
    ),
});

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

const completeProfileSchema = z.object({
  name: z.string().nonempty("Name is required."), // Mandatory field
  about: z.string().nonempty("About is required."), // Mandatory field
  email: z.string().email("Invalid email address.").optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .optional(),
  github: z.string().url("Invalid GitHub URL.").optional(),
  linkedin: z.string().url("Invalid LinkedIn URL.").optional(),
  x: z.any().optional(), // Accepts any type
  profilePicture: z
    .string()
    .url("Invalid URL format.")
    .regex(
      /^https:\/\/media\.discordapp\.net\/.*/,
      "Invalid Discord media URL."
    ).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
  // .regex(
  //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  //   "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
  // ),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  about: z.string().optional(),
  email: z.string().email("Invalid email address.").optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .optional(),
  github: z.string().url("Invalid GitHub URL.").optional(),
  linkedin: z.string().url("Invalid LinkedIn URL.").optional(),
  x: z.any().optional(), // Accepts any type, optional
  profilePicture: z
    .string()
    .url("Invalid URL format.")
    .regex(
      /^https:\/\/media\.discordapp\.net\/.*/,
      "Invalid Discord media URL."
    )
    .optional(),
});


module.exports = {
  userSignupSchema,
  userSigninSchema,
  completeProfileSchema,
  changePasswordSchema,
  updateProfileSchema
};
