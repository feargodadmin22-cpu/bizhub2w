import { Role } from "@prisma/client";

/**
 * Section 2.5 — role checks happen on the server, never just hidden buttons.
 * Every server action that touches an owner-only capability must call
 * assertOwner() before doing anything else, including before validating
 * the rest of the input. Fail closed.
 */

export type SessionUser = {
  id: string;
  shopId: string;
  role: Role;
  canSeeCostAndProfit: boolean;
  status: "active" | "disabled";
};

export class ForbiddenError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertOwner(user: SessionUser) {
  if (user.role !== "owner") {
    throw new ForbiddenError("Owner-only action");
  }
}

export function assertActive(user: SessionUser) {
  if (user.status !== "active") {
    throw new ForbiddenError("Account disabled");
  }
}

/** Manager or Owner may record sales, view stock/prices. Staff can too — this
 * gate exists for the few actions Staff genuinely cannot do (see table below). */
export function assertManagerOrOwner(user: SessionUser) {
  if (user.role !== "owner" && user.role !== "manager") {
    throw new ForbiddenError("Manager or Owner only");
  }
}

/**
 * Section 2.2/2.3 — strips cost_price, profit, margin from any payload
 * before it ever leaves the server, based on the caller's own
 * can_see_cost_and_profit flag (Owner is always true). This must be the
 * LAST step before returning data from every product/report/sale-item
 * query — never rely on the client to hide these fields.
 */
export function filterCostFields<T extends Record<string, any>>(
  rows: T | T[],
  user: SessionUser
): T | T[] {
  const canSee = user.role === "owner" || user.canSeeCostAndProfit;
  if (canSee) return rows;

  const strip = (row: T): T => {
    const clone = { ...row };
    delete (clone as any).costPrice;
    delete (clone as any).cost_price;
    delete (clone as any).costPriceAtSale;
    delete (clone as any).cost_price_at_sale;
    delete (clone as any).profit;
    delete (clone as any).margin;
    return clone;
  };

  return Array.isArray(rows) ? rows.map(strip) : strip(rows);
}

/** Owner-only capabilities per Section 2.5 / Section 8 permission table. */
export const OWNER_ONLY_ACTIONS = [
  "addExpense",
  "editProductCost",
  "manageStaff",
  "exportReports",
  "deleteShop",
] as const;
