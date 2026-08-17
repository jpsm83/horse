/**
 * pedigreeConnectionService — consent sire/dam links; ownership never changes.
 */

import { describe, expect, it, vi } from "vitest";
import Horse from "@/models/Horse.ts";
import PedigreeConnection from "@/models/PedigreeConnection.ts";
import * as userService from "@/lib/services/userService.ts";
import * as pedigreeConnectionService from "@/lib/services/pedigreeConnectionService.ts";
import { sendPedigreeConnectInviteEmail } from "@/lib/email/sendPedigreeConnectInviteEmail.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Test",
  });
}

async function createHorse(ownerId: string, name: string, microchipId: string) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
    microchipId,
    registration: { payerUserId: ownerId, isActive: true },
  });
}

describe("pedigreeConnectionService", () => {
  it("links existing parent on accept without changing ownership", async () => {
    const childOwner = await createUser("pc-child@example.com");
    const parentOwner = await createUser("pc-parent@example.com");
    const child = await createHorse(String(childOwner._id), "Foal", "mcfoal1");
    const parent = await createHorse(String(parentOwner._id), "SireStar", "mcsire1");

    const pending = await pedigreeConnectionService.createPedigreeConnection(
      String(childOwner._id),
      {
        childHorseId: String(child._id),
        role: "sire",
        parentHorseId: String(parent._id),
      },
    );

    expect(pending.status).toBe("pending");
    expect(sendPedigreeConnectInviteEmail).toHaveBeenCalled();

    await pedigreeConnectionService.acceptPedigreeConnection(
      String(parentOwner._id),
      pending.id,
    );

    const updatedChild = await Horse.findById(child._id).lean();
    expect(String((updatedChild?.pedigree as { sireHorseId?: unknown })?.sireHorseId)).toBe(
      String(parent._id),
    );
    expect((updatedChild?.pedigree as { sireName?: string })?.sireName).toBe("SireStar");

    const unchangedParent = await Horse.findById(parent._id).lean();
    expect(String(unchangedParent?.mainOwnerUserId)).toBe(String(parentOwner._id));
    expect(String(updatedChild?.mainOwnerUserId)).toBe(String(childOwner._id));
  });

  it("creates parent horse stub on invite accept", async () => {
    const childOwner = await createUser("pc-invite-child@example.com");
    const parentOwner = await createUser("pc-invite-parent@example.com");
    const child = await createHorse(String(childOwner._id), "Filly", "mcfilly1");

    const pending = await pedigreeConnectionService.createPedigreeConnection(
      String(childOwner._id),
      {
        childHorseId: String(child._id),
        role: "dam",
        parentHorseName: "DamQueen",
        invitedEmail: "pc-invite-parent@example.com",
      },
    );

    await pedigreeConnectionService.acceptPedigreeConnection(
      String(parentOwner._id),
      pending.id,
    );

    const updatedChild = await Horse.findById(child._id).lean();
    const damId = (updatedChild?.pedigree as { damHorseId?: unknown })?.damHorseId;
    expect(damId).toBeTruthy();

    const dam = await Horse.findById(damId).lean();
    expect(dam?.name).toBe("DamQueen");
    expect(dam?.microchipId).toBeUndefined();
    expect(String(dam?.mainOwnerUserId)).toBe(String(parentOwner._id));
  });

  it("requires child main owner to initiate", async () => {
    const childOwner = await createUser("pc-forbidden-child@example.com");
    const stranger = await createUser("pc-forbidden-stranger@example.com");
    const parentOwner = await createUser("pc-forbidden-parent@example.com");
    const child = await createHorse(String(childOwner._id), "Blocked Foal", "mcblocked1");
    const parent = await createHorse(String(parentOwner._id), "Blocked Sire", "mcblocksire1");

    await expect(
      pedigreeConnectionService.createPedigreeConnection(String(stranger._id), {
        childHorseId: String(child._id),
        role: "sire",
        parentHorseId: String(parent._id),
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rolls back pending doc when email send fails", async () => {
    vi.mocked(sendPedigreeConnectInviteEmail).mockRejectedValueOnce(new Error("SMTP down"));

    const childOwner = await createUser("pc-email-fail-child@example.com");
    const parentOwner = await createUser("pc-email-fail-parent@example.com");
    const child = await createHorse(String(childOwner._id), "Email Fail Foal", "mcemailfail1");
    const parent = await createHorse(String(parentOwner._id), "Email Fail Sire", "mcemailfailsire1");

    await expect(
      pedigreeConnectionService.createPedigreeConnection(String(childOwner._id), {
        childHorseId: String(child._id),
        role: "sire",
        parentHorseId: String(parent._id),
      }),
    ).rejects.toThrow("SMTP down");

    const count = await PedigreeConnection.countDocuments({ childHorseId: child._id });
    expect(count).toBe(0);
  });

  it("decline and cancel leave child pedigree unchanged", async () => {
    const childOwner = await createUser("pc-decline-child@example.com");
    const parentOwner = await createUser("pc-decline-parent@example.com");
    const child = await createHorse(String(childOwner._id), "Decline Foal", "mcdecline1");
    const parent = await createHorse(String(parentOwner._id), "Decline Sire", "mcdeclinesire1");

    const pending = await pedigreeConnectionService.createPedigreeConnection(
      String(childOwner._id),
      {
        childHorseId: String(child._id),
        role: "sire",
        parentHorseId: String(parent._id),
      },
    );

    await pedigreeConnectionService.declinePedigreeConnection(
      String(parentOwner._id),
      pending.id,
    );

    let reloaded = await Horse.findById(child._id).lean();
    expect((reloaded?.pedigree as { sireHorseId?: unknown })?.sireHorseId).toBeUndefined();

    const pending2 = await pedigreeConnectionService.createPedigreeConnection(
      String(childOwner._id),
      {
        childHorseId: String(child._id),
        role: "dam",
        parentHorseName: "Cancel Dam",
        invitedEmail: "pc-decline-parent@example.com",
      },
    );

    await pedigreeConnectionService.cancelPedigreeConnection(String(childOwner._id), pending2.id);

    reloaded = await Horse.findById(child._id).lean();
    expect((reloaded?.pedigree as { damHorseId?: unknown })?.damHorseId).toBeUndefined();
  });
});
