/** True when ref looks like a MongoDB ObjectId (staff membership invite). */
export function isStaffMembershipRef(ref: string): boolean {
  return /^[a-f\d]{24}$/i.test(ref.trim());
}
