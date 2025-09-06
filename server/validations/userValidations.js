// user validation
const { z } = require("zod");

const userSignupSchema = z.object({
  email: z.string().email("Invalid email format."),
  role: z.string().optional(),
}).refine((data) => {
  // Role-based email validation
  if (data.role === "student" || data.role === "alumni") {
    // Allow common email domains for students and alumni
    const allowedDomains = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@icloud.com"];
    return allowedDomains.some(domain => data.email.endsWith(domain));
  } else if (data.role === "teacher") {
    // Teachers must use SOA email
    return data.email.endsWith("@soa.ac.in");
  }
  return true; // No validation for other roles
}, {
  message: (data) => {
    if (data.role === "student" || data.role === "alumni") {
      return "Student and alumni emails must end with @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, or @icloud.com";
    } else if (data.role === "teacher") {
      return "Teacher email must end with @soa.ac.in";
    }
    return "Invalid email domain for the selected role";
  },
  path: ["email"]
});

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string()
  // .min(6, "Password must be at least 6 characters long."),
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
