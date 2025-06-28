// user validation
const { z } = require("zod");

const userSignupSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format.")
      // .refine(
      //   (email) => {
      //     const role = this.role;
      //     if (role === "teacher") {
      //       return email.endsWith("@soa.ac.in");
      //     }
      //     return !email.endsWith("@soa.ac.in");
      //   },
      //   (email) => {
      //     const role = this.role;
      //     return {
      //       message:
      //         role === "teacher"
      //           ? "Teacher email must end with '@soa.ac.in'"
      //           : "Email should not end with '@soa.ac.in'",
      //     };
      //   }
      // ),
    // role: z.enum(["student", "teacher", "alumni"]),
  })

const userSigninSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

const completeProfileSchema = z.object({
  // name: z.string().nonempty("Name is required."), // Mandatory field
  // about: z.string().nonempty("About is required."), // Mandatory field
  // email: z.string().email("Invalid email address."),
  // password: z.string().min(6, "Password must be at least 6 characters long."),
  // github: z
  //   .string()
  //   .url("Invalid GitHub URL.")
  //   .optional()
  //   .refine(
  //     (url) => !url || url.startsWith("https://github.com/"),
  //     "Invalid GitHub URL. It must start with 'https://github.com/'"
  //   ),
  // linkedin: z
  //   .string()
  //   .url("Invalid LinkedIn URL.")
  //   .nonempty("LinkedIn profile is required.")
  //   .optional()
  //   .refine(
  //     (url) => url.startsWith("https://www.linkedin.com/"),
  //     "Invalid LinkedIn URL. It must start with 'https://www.linkedin.com/'"
  //   ),
  // x: z
  //   .string()
  //   .url("Invalid X (Twitter) URL.")
  //   .optional()
  //   .refine(
  //     (url) =>
  //       !url ||
  //       url.startsWith("https://twitter.com/") ||
  //       url.startsWith("https://x.com/"),
  //     "Invalid X URL. It must start with 'https://twitter.com/' or 'https://x.com/'"
  //   ),
  // profilePicture: z
  //   .string()
  //   // .url("Invalid URL format.")
  //   // .regex(
  //   //   /^https:\/\/media\.discordapp\.net\/.*/,
  //   //   "Invalid Discord media URL."
  //   // )
  //   .optional(),
  // bannerPhoto: z.string().optional(),
  // fieldsOfInterest: z
  //   .array(z.string().nonempty("Interest must not be empty."))
  //   .min(1, "At least one interest is required.")
  //   .optional(),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  name: z.string().nonempty("Name is required."),
  about: z.string().nonempty("About is required."),
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
    .optional()
    .refine(
      (url) => !url || url.startsWith("https://www.linkedin.com/"),
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
  profilePicture: z.string().optional(),
  bannerPhoto: z.string().optional(),
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
