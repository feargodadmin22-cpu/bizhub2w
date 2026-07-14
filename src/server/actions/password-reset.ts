"use server";

import { adminPrisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * No email service is wired up yet, so this returns the reset link
 * directly to the caller instead of emailing it — meant for you to
 * manually share with the person during this phase. Swapping in real
 * email delivery later just means calling a mail API here instead of
 * returning the link, without changing anything else.
 */
export async function requestPasswordReset(email: string) {
  const user = await adminPrisma.user.findFirst({ where: { contact: email, status: "active" } });

  // Always return success-shaped data even if no match, so this can't be
  // used to check which emails have accounts (basic enumeration hygiene).
  if (!user) return { requested: true };

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await adminPrisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiresAt: expiresAt },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.contact, resetLink);

  return { requested: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await adminPrisma.user.findUnique({ where: { resetToken: token } });

  if (!user) throw new Error("Invalid or expired reset link");
  if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw new Error("This reset link has expired — request a new one");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await adminPrisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  await logActivity(adminPrisma, {
    shopId: user.shopId,
    userId: user.id,
    actionType: "user.password_reset",
    description: `${user.name} reset their password`,
  });

  return { success: true };
}