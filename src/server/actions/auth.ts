"use server";

import { adminPrisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { assertOwner } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

type SignupInput = {
  shopName: string;
  ownerName: string;
  ownerEmail: string;
  ownerContact: string;
  password: string;
};

export async function signupShop(input: SignupInput) {
  const existing = await adminPrisma.user.findFirst({ where: { contact: input.ownerEmail } });
  if (existing) throw new Error("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);

  return adminPrisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: { name: input.shopName, ownerContact: input.ownerContact },
    });

    const branch = await tx.branch.create({
      data: { shopId: shop.id, name: "Main Branch" },
    });

    const owner = await tx.user.create({
      data: {
        shopId: shop.id,
        name: input.ownerName,
        contact: input.ownerEmail,
        passwordHash,
        role: "owner",
        canSeeCostAndProfit: true,
      },
    });

    await logActivity(tx, {
      shopId: shop.id,
      userId: owner.id,
      actionType: "shop.created",
      description: `${owner.name} created shop "${shop.name}"`,
    });

    await tx.unit.createMany({
      data: ["Piece", "Carton", "Bag", "Kg", "Litre", "Dozen", "Pack"].map((name) => ({
        shopId: shop.id,
        name,
      })),
    });

    return { shop, branch, owner };
  });
}

type CreateInviteInput = { name: string; contact: string; role: "manager" | "staff" };

export async function createStaffInvite(input: CreateInviteInput) {
  const session = await getServerSession();
  assertOwner(session);

  const code = randomBytes(4).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const invitedUser = await adminPrisma.user.create({
    data: {
      shopId: session.shopId,
      name: input.name,
      contact: input.contact,
      passwordHash: "",
      role: input.role,
      canSeeCostAndProfit: input.role === "manager",
      inviteCode: code,
      inviteExpiresAt: expiresAt,
      status: "disabled",
    },
  });

  await logActivity(adminPrisma, {
    shopId: session.shopId,
    userId: session.id,
    actionType: "staff.invited",
    description: `Invited ${input.name} as ${input.role}`,
  });

  return { code, expiresAt, userId: invitedUser.id };
}

type RedeemInviteInput = { code: string; email: string; password: string };

export async function redeemInvite(input: RedeemInviteInput) {
  const pending = await adminPrisma.user.findUnique({ where: { inviteCode: input.code } });

  if (!pending) throw new Error("Invalid invite code");
  if (pending.status === "active") throw new Error("Invite already used");
  if (!pending.inviteExpiresAt || pending.inviteExpiresAt < new Date()) {
    throw new Error("Invite code has expired");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const activated = await adminPrisma.user.update({
    where: { id: pending.id },
    data: {
      contact: input.email,
      passwordHash,
      status: "active",
      inviteCode: null,
      inviteExpiresAt: null,
    },
  });

  await logActivity(adminPrisma, {
    shopId: activated.shopId,
    userId: activated.id,
    actionType: "staff.invite_redeemed",
    description: `${activated.name} activated their account`,
  });

  return activated;
}