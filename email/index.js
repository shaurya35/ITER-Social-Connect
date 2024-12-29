const fs = require("fs");
require("dotenv").config();
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const path = require("path");

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Change as per your email provider
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.PASSWORD, // Your email password or app-specific password
  },
});

// Get all images from the "images" folder
const imageFolder = path.join(__dirname, "images");
const imageFiles = fs
  .readdirSync(imageFolder)
  .filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

// Generate the attachments array
const attachments = imageFiles.map((file) => ({
  filename: file,
  path: path.join(imageFolder, file),
  cid: path.basename(file, path.extname(file)), // Use the filename without extension as cid
}));

// Function to send personalized HTML emails with rate limiting (setTimeout)
const sendEmails = async (emailFilePath, subjectTemplate, htmlFilePath) => {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(emailFilePath);
    const sheetName = workbook.SheetNames[0]; // Assuming emails are in the first sheet
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Check if the necessary columns exist
    const requiredColumns = [
      "Email Address",
      "Full Name",
      "What is your current year of study? ",
      "  What kind of projects excite you the most?  ",
      "  How would you describe your current skill level?  ",
    ];
    const missingColumns = requiredColumns.filter(
      (col) => !sheetData[0] || !(col in sheetData[0])
    );

    if (missingColumns.length > 0) {
      console.log(
        `Missing columns in the Excel file: ${missingColumns.join(", ")}`
      );
      return;
    }

    // Read the HTML file
    const htmlTemplate = fs.readFileSync(htmlFilePath, "utf8");

    // Initialize the counter for emails sent
    let emailCount = 0;

    // Send personalized emails with rate-limiting (delay)
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      const recipientEmail = row["Email Address"];
      const fullName = row["Full Name"];
      const yearOfStudy = row["What is your current year of study? "].trim();
      const projectInterest =
        row["  What kind of projects excite you the most?  "].trim();
      const skillLevel =
        row["  How would you describe your current skill level?  "].trim();

      // Customize the subject and HTML body
      const subject = subjectTemplate;
      const htmlBody = htmlTemplate
        .replace("{fullName}", fullName)
        .replace("{yearOfStudy}", yearOfStudy)
        .replace("{projectInterest}", projectInterest)
        .replace("{skillLevel}", skillLevel);

      const mailOptions = {
        from: process.env.EMAIL,
        to: recipientEmail,
        subject: subject,
        html: htmlBody,
        attachments,
      };

      // Send email with a delay using setTimeout
      try {
        await new Promise((resolve) => {
          setTimeout(async () => {
            try {
              await transporter.sendMail(mailOptions);
              emailCount++; // Increment email sent counter
              console.log(`Email sent to: ${recipientEmail} ${emailCount}`);
            } catch (emailError) {
              console.error(
                `Failed to send email to ${recipientEmail}:`,
                emailError
              );
            }
            resolve();
          }, i * 2000); // 2000 ms delay (2 seconds) between emails
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${recipientEmail}:`, emailError);
      }
    }

    console.log("\nAll emails sent successfully!");
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

// Example usage
const emailFilePath = "./emails.xlsx"; // Path to the Excel file
const emailSubject = "Welcome to ITER Social Connect!";
const htmlFilePath = "./email.html"; // Path to the HTML file

sendEmails(emailFilePath, emailSubject, htmlFilePath);
