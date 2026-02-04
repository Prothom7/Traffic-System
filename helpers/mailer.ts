import nodemailer from "nodemailer";

export interface SendEmailProp {
  email: string;
  emailType: "VERIFY" | "RESET";
  token: string;
  vehicleId: string; 
}

export const sendEmail = async ({
  email,
  emailType,
  token,
  vehicleId,
}: SendEmailProp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let subject = "";
    let html = "";

    if (emailType === "VERIFY") {
      subject = "Verify your vehicle registration";
      html = `
        <p>Please verify your vehicle registration</p>
        <a href="${process.env.DOMAIN}/verify?token=${token}&id=${vehicleId}">
          Click here to verify
        </a>
      `;
    }

    if (emailType === "RESET") {
      subject = "Reset your password";
      html = `
        <p>Reset your password</p>
        <a href="${process.env.DOMAIN}/reset-password?token=${token}&id=${vehicleId}">
          Click here to reset password
        </a>
      `;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error("Send email error:", error);
    throw new Error("Email could not be sent");
  }
};
