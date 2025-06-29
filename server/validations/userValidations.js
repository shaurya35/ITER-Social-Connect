// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email("Invalid email format."),
});

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

const completeProfileSchema = z.object({
  name: z.string().nonempty("Name is required."),
  about: z.string().nonempty("About is required."),

  github: z
    .string()
    .url("Invalid GitHub URL.")
    .optional()
    .refine(
      (url) => !url || url.startsWith("https://github.com/"),
      "GitHub URL must start with 'https://github.com/'"
    ),

  linkedin: z
    .string()
    .url("Invalid LinkedIn URL.")
    .optional()
    .refine(
      (url) => !url || url.startsWith("https://www.linkedin.com/"),
      "LinkedIn URL must start with 'https://www.linkedin.com/'"
    ),

  x: z
    .string()
    .url("Invalid X (Twitter) URL.")
    .optional()
    .refine(
      (url) =>
        !url ||
        url.startsWith("https://twitter.com/") ||
        url.startsWith("https://x.com/"),
      "X URL must start with 'https://twitter.com/' or 'https://x.com/'"
    ),

  profilePicture: z.string().optional(),

  fieldsOfInterest: z
    .array(z.string().nonempty("Interest must not be empty."))
    .min(1, "At least one interest is required.")
    .optional(),
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

  github: z
    .string()
    .url("Invalid GitHub URL.")
    .optional()
    .refine(
      (url) => !url || url.startsWith("https://github.com/"),
      "GitHub URL must start with 'https://github.com/'"
    ),

  linkedin: z
    .string()
    .url("Invalid LinkedIn URL.")
    .optional()
    .refine(
      (url) => !url || url.startsWith("https://www.linkedin.com/"),
      "LinkedIn URL must start with 'https://www.linkedin.com/'"
    ),

  x: z
    .string()
    .url("Invalid X (Twitter) URL.")
    .optional()
    .refine(
      (url) =>
        !url ||
        url.startsWith("https://twitter.com/") ||
        url.startsWith("https://x.com/"),
      "X URL must start with 'https://twitter.com/' or 'https://x.com/'"
    ),

  profilePicture: z.string().url("Invalid profile picture URL.").optional(),

  bannerPhoto: z.string().url("Invalid profile picture URL.").optional(),

  fieldsOfInterest: z
    .array(z.string().nonempty("Interest must not be empty."))
    .min(1, "At least one interest is required.")
    .optional(),
});

const teacherSignupSchema = z.object({
  email: z
    .string()
    .email("Invalid email format.")
    .refine((email) => email.endsWith("@soa.ac.in"), {
      message: "Only SOA faculty emails (ending with @soa.ac.in) are allowed.",
    }),
});

module.exports = {
  userSignupSchema,
  userSigninSchema,
  completeProfileSchema,
  changePasswordSchema,
  updateProfileSchema,
  teacherSignupSchema,
};
