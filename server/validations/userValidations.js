// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z
    .string()
    .email("Invalid email format.")
    .refine(
      (email) => !email.endsWith("@soa.ac.in"),
      "Email should not end with @soa.ac.in"
    ),
  // password: z.string().min(6, "Password must be at least 6 characters long."),
  // regNo: z
  //   .string()
  //   .regex(/^\d{10}$/, "Registration number must be a 10-digit number.")
  //   .transform(String),
  discordUrl: z
    .string()
    .url("Invalid URL format.")
    .regex(
      /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/.*/,
      "Invalid Supabase storage URL."
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
  github: z
    .string()
    .url("Invalid GitHub URL.")
    .optional()
    .refine(
      (url) => !url || url.startsWith("https://github.com/"),
      "Invalid GitHub URL. It must start with 'https://github.com/'"
    ),
  linkedin: z
    .string()
    .url("Invalid LinkedIn URL.")
    .nonempty("LinkedIn profile is required.")
    .refine(
      (url) => url.startsWith("https://www.linkedin.com/"),
      "Invalid LinkedIn URL. It must start with 'https://www.linkedin.com/'"
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
      "Invalid X URL. It must start with 'https://twitter.com/' or 'https://x.com/'"
    ),
  profilePicture: z
    .string()
    .url("Invalid URL format.")
    .regex(
      /^https:\/\/media\.discordapp\.net\/.*/,
      "Invalid Discord media URL."
    )
    .optional(),
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
