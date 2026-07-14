import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Using Resend's shared test domain for now — swap "onboarding@resend.dev"
// for a verified domain address (e.g. noreply@yourshopdomain.com) once
// you've verified a real domain in the Resend dashboard.
const FROM_ADDRESS = "Business Hub <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Business Hub password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #166534;">Reset your password</h2>
        <p>We received a request to reset your Business Hub password. Click the button below to choose a new one.</p>
        <a href="${resetLink}" style="display: inline-block; background: #F59E0B; color: #1F1F1F; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}