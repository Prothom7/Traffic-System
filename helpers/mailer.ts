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
    const smtpHost = process.env.SMTP_HOST || process.env.MAILTRAP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || process.env.MAILTRAP_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.MAILTRAP_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.MAILTRAP_PASS;
    const smtpFrom =
      process.env.SMTP_FROM ||
      process.env.MAILTRAP_FROM ||
      process.env.EMAIL_FROM;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      throw new Error(
        "SMTP settings are missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM (or MAILTRAP_* equivalents)."
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    let subject = "";
    let html = "";

    const baseUrl = process.env.DOMAIN || "";

    const buildEmailLayout = (contentHtml: string) => `
      <div style="background: #f5f7fb; padding: 32px 16px; font-family: 'Poppins', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);">
          <div style="background: linear-gradient(135deg, #0a3161, #0f4c81); color: #ffffff; padding: 24px 28px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; letter-spacing: 1px;">Traffic System</div>
            <div style="font-size: 12px; opacity: 0.85; margin-top: 6px;">Vehicle Services</div>
          </div>
          <div style="padding: 28px; color: #1f2937;">
            ${contentHtml}
          </div>
          <div style="padding: 18px 28px; background: #f0f4f9; color: #5b6777; font-size: 12px; text-align: center;">
            If you did not request this, you can safely ignore this email.
          </div>
        </div>
      </div>
    `;

    if (emailType === "VERIFY") {
      subject = "Verify your vehicle registration";
      const verifyUrl = `${baseUrl}/api/authentication/verifyemail?token=${token}`;
      html = buildEmailLayout(`
        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0a3161;">Verify your vehicle registration</h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
          Thanks for registering your vehicle. Please confirm your email to activate your account.
        </p>
        <div style="text-align: center; margin: 22px 0 16px;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 22px; background: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Verify Email
          </a>
        </div>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Or copy and paste this link into your browser: <br />
          <span style="color: #0a3161; word-break: break-all;">${verifyUrl}</span>
        </p>
      `);
    }

    if (emailType === "RESET") {
      subject = "Reset your password";
      const resetUrl = `${baseUrl}/reset-password?token=${token}&id=${vehicleId}`;
      html = buildEmailLayout(`
        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0a3161;">Reset your password</h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to continue.
        </p>
        <div style="text-align: center; margin: 22px 0 16px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 22px; background: #0a3161; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Or copy and paste this link into your browser: <br />
          <span style="color: #0a3161; word-break: break-all;">${resetUrl}</span>
        </p>
      `);
    }

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    console.error("Send email error:", error);
    throw new Error("Email could not be sent");
  }
};
