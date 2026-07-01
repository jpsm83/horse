import { describe, expect, it } from "vitest";
import {
  createOwnershipTransferSchema,
  updateOwnershipTransferStatusSchema,
} from "@/lib/validations/ownershipTransfer.ts";

describe("createOwnershipTransferSchema", () => {
  it("accepts transfer_main with receiverUserId", () => {
    const parsed = createOwnershipTransferSchema.parse({
      entityType: "horse",
      entityId: "507f1f77bcf86cd799439011",
      transferKind: "transfer_main",
      receiverUserId: "507f1f77bcf86cd799439012",
    });

    expect(parsed.transferKind).toBe("transfer_main");
  });

  it("accepts transfer_main with invitedEmail", () => {
    const parsed = createOwnershipTransferSchema.parse({
      entityType: "stable",
      entityId: "507f1f77bcf86cd799439011",
      transferKind: "transfer_main",
      invitedEmail: "buyer@example.com",
    });

    expect(parsed.invitedEmail).toBe("buyer@example.com");
  });

  it("requires targetCoOwnerUserId for remove_co_owner", () => {
    expect(() =>
      createOwnershipTransferSchema.parse({
        entityType: "horse",
        entityId: "507f1f77bcf86cd799439011",
        transferKind: "remove_co_owner",
      }),
    ).toThrow();
  });

  it("rejects transfer_main with both receiverUserId and invitedEmail", () => {
    expect(() =>
      createOwnershipTransferSchema.parse({
        entityType: "horse",
        entityId: "507f1f77bcf86cd799439011",
        transferKind: "transfer_main",
        receiverUserId: "507f1f77bcf86cd799439012",
        invitedEmail: "buyer@example.com",
      }),
    ).toThrow();
  });
});

describe("updateOwnershipTransferStatusSchema", () => {
  it("accepts accepted or declined", () => {
    expect(updateOwnershipTransferStatusSchema.parse({ status: "accepted" }).status).toBe(
      "accepted",
    );
    expect(updateOwnershipTransferStatusSchema.parse({ status: "declined" }).status).toBe(
      "declined",
    );
  });

  it("rejects other status values", () => {
    expect(() =>
      updateOwnershipTransferStatusSchema.parse({ status: "pending" }),
    ).toThrow();
  });
});
