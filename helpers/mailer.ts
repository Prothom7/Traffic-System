import nodemailer from "nodemailer";

interface SendEmailProps {
  email: string;
  emailType: "VERIFY";
  token: string; // always plain token
  userId?: string;
}

export const sendEmail = async ({ email, emailType, token }: SendEmailProps) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    // Verification link
    const verifyUrl =
      emailType === "VERIFY"
        ? `${process.env.DOMAIN}/api/authentication/verifyemail?token=${token}`
        : "";

    const mailOptions = {
      from: `"Website" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6">
          <h2>Verify Your Email</h2>
          <p>Click the button below to complete verification:</p>
          <a href="${verifyUrl}"
            style="
              display:inline-block;
              padding:10px 16px;
              background:#2563eb;
              color:#fff;
              text-decoration:none;
              border-radius:6px;
            "
          >Verify Now</a>
          <p style="margin-top:20px;font-size:12px;color:#666">
            This link will expire in 1 hour.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("✅ Mail sent via Mailtrap");

    return true;
  } catch (error: any) {
    console.error("Mailer error:", error);
    throw new Error("Email could not be sent");
  }
};
