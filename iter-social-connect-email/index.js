require("dotenv").config();
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Change as per your email provider
  auth: {
    user: process.env.EMAIL, // Your email
    pass: process.env.PASSWORD, // Your email password or app-specific password
  },
});

// Function to send personalized emails
const sendEmails = async (emailFilePath, subjectTemplate, bodyTemplate) => {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(emailFilePath);
    const sheetName = workbook.SheetNames[0]; // Assuming emails are in the first sheet
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Check if the necessary columns exist
    const requiredColumns = ["Email Address", "Full Name", "What is your current year of study? ", "  What kind of projects excite you the most?  ", "  How would you describe your current skill level?  "];
    const missingColumns = requiredColumns.filter(col => !sheetData[0] || !(col in sheetData[0]));

    if (missingColumns.length > 0) {
      console.log(`Missing columns in the Excel file: ${missingColumns.join(", ")}`);
      return;
    }

    // Send personalized emails
    for (const row of sheetData) {
      const recipientEmail = row["Email Address"];
      const fullName = row["Full Name"];
      const yearOfStudy = row["What is your current year of study? "].trim();
      const projectInterest = row["  What kind of projects excite you the most?  "].trim();
      const skillLevel = row["  How would you describe your current skill level?  "].trim();

      // Customize the subject and body
      const subject = subjectTemplate;
      const body = bodyTemplate
        .replace("{fullName}", fullName)
        .replace("{yearOfStudy}", yearOfStudy)
        .replace("{projectInterest}", projectInterest)
        .replace("{skillLevel}", skillLevel);

      const mailOptions = {
        from: process.env.EMAIL,
        to: recipientEmail,
        subject: subject,
        text: body,
      };

      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to: ${recipientEmail}`);
    }

    console.log("All emails sent successfully!");
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

// Example usage
const emailFilePath = "./emails.xlsx"; // Path to the Excel file
const emailSubject = "Welcome to ITER Social Connect!";
const emailBody = `
Dear {fullName},

Greetings from ITER Social Connect!

We’re thrilled to have you with us. As a {yearOfStudy}-year student with an interest in {projectInterest}, and at a {skillLevel} level, your enthusiasm is truly inspiring.

This email is a test to ensure our system is functioning correctly. No further action is required from you.

Stay connected for more exciting updates and opportunities!

Best regards,  
Satyam Kumar  
ITER-SOCIAL-CONNECT
`;

sendEmails(emailFilePath, emailSubject, emailBody);
