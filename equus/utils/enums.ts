/** Horse disciplines and service categories */
export const horseDisciplineEnums = [
  "Jumping",
  "Dressage",
  "Eventing",
  "Racing",
  "Breeding",
  "Rehabilitation",
  "Leisure",
  "Western",
  "Endurance",
  "Driving",
  "Other",
] as const;

export const horseSexEnums = [
  "Stallion",
  "Mare",
  "Gelding",
  "Colt",
  "Filly",
  "Other",
] as const;

export const horseColorEnums = [
  "Bay",
  "Chestnut",
  "Black",
  "Grey",
  "Palomino",
  "Roan",
  "Pinto",
  "Appaloosa",
  "Other",
] as const;

/**
 * Party kind on Relationship requester/receiver metadata and Horse.attributedAccountType.
 * Role profiles (stable, trainer, …) pair with `*AccountId` on the role document.
 * `horse` — user on the horse-ownership side (no Horse profile on User); horse identity
 * is always `Relationship.horseId`. Not a navigational subsection id on User.
 */
export const accountTypeEnums = [
  "horse",
  "stable",
  "trainer",
  "veterinary",
  "groom",
  "farrier",
  "rider",
  "breeder",
  "ridingClub",
  "transport",
  "coach",
] as const;

/** Supported UI and email locales for Equus web and mobile clients. */
export const appLocaleEnums = ["en", "es"] as const;

/** User-level privacy and discoverability controls for profile exposure. */
export const userProfileVisibilityEnums = [
  "public",
  "platform",
  "relationships",
  "private",
] as const;

/** Who may start direct messages with this user profile. */
export const userDirectMessageAudienceEnums = [
  "everyone",
  "relationships",
  "nobody",
] as const;

export const userTypeEnums = ["individual", "business"] as const;

/** Business role profiles that support staff memberships (subset of accountTypeEnums). */
export const businessRoleTypeEnums = [
  "stable",
  "breeder",
  "ridingClub",
  "transport",
] as const;

/** Lifecycle status for WorkplaceRelationship documents. */
export const workplaceRelationshipStatusEnums = [
  "invited",
  "active",
  "suspended",
  "declined",
  "ended",
] as const;

/** Hierarchy level on a host role profile collaboration. */
export const workplaceHierarchyLevelEnums = ["admin", "manager", "staff"] as const;

/** @deprecated Use workplaceHierarchyLevelEnums */
export const roleStaffLevelEnums = workplaceHierarchyLevelEnums;

/** @deprecated Use workplaceRelationshipStatusEnums — `removed` renamed to `ended` */
export const roleMembershipStatusEnums = [
  "invited",
  "active",
  "suspended",
  "declined",
  "removed",
] as const;

export const relationshipTypeEnums = [
  "stable",
  "trainer",
  "veterinary",
  "groom",
  "farrier",
  "rider",
  "breeder",
  "ridingClub",
  "transport",
  "coach",
] as const;

export const relationshipStatusEnums = [
  "pending",
  "accepted",
  "declined",
  "ended",
] as const;

/** Entity-owned profiles eligible for ownership transfer (not user-linked services). */
export const ownershipTransferEntityTypeEnums = [
  "horse",
  "stable",
  "breeder",
  "transport",
  "ridingClub",
] as const;

export const ownershipTransferKindEnums = [
  "transfer_main",
  "remove_co_owner",
  "promote_co_owner",
  "add_responsible",
  "remove_responsible",
] as const;

export const ownershipTransferStatusEnums = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
] as const;

export const saleStatusEnums = ["not_for_sale", "for_sale"] as const;

export const bookingStatusEnums = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
  "rescheduled",
] as const;

export const invoiceStatusEnums = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;

export const documentTypeEnums = [
  "passport",
  "insurance",
  "contract",
  "certificate",
  "medical",
  "invoice",
  "ownership",
  "competition",
  "other",
] as const;

export const verificationStatusEnums = [
  "unverified",
  "pending",
  "verified",
] as const;

export const currencyEnums = ["USD", "EUR", "GBP", "CHF", "AUD", "CAD"] as const;

export const notificationTypeEnums = [
  "info",
  "warning",
  "relationship",
  "booking",
  "invoice",
  "message",
  "subscription",
  "system",
  "media_deletion",
] as const;

export const genderEnums = ["Man", "Woman", "Other"] as const;

export const idTypeEnums = [
  "Passport",
  "National ID",
  "Driver License",
  "Tax ID",
  "Other",
] as const;

export const visibilityEnums = ["public", "relationship", "owner_only"] as const;

export const transportSpecialtyEnums = [
  "local",
  "long_distance",
  "competition",
  "emergency",
  "international",
  "other",
] as const;

export const stableServiceEnums = [
  "boarding",
  "training",
  "lessons",
  "rehabilitation",
  "breeding",
  "sales",
  "other",
] as const;

export const ratingCategoryEnums = [
  "communication",
  "horseCare",
  "transparency",
  "professionalism",
  "facilities",
  "results",
  "availability",
] as const;

export const expenseCategoryEnums = [
  "boarding",
  "training",
  "veterinary",
  "transport",
  "farrier",
  "competition",
  "insurance",
  "feed",
  "other",
] as const;

export const tierEnums = ["free", "bronze", "silver", "gold", "diamond"] as const;

export const horseBreedEnums = [
  "Akhal-Teke",
  "American Paint Horse",
  "American Quarter Horse",
  "American Saddlebred",
  "Andalusian",
  "Appaloosa",
  "Arabian",
  "Belgian Draft",
  "Belgian Warmblood",
  "Camargue",
  "Canadian Horse",
  "Cleveland Bay",
  "Clydesdale",
  "Connemara Pony",
  "Dartmoor Pony",
  "Dutch Warmblood",
  "Exmoor Pony",
  "Fell Pony",
  "Fjord",
  "Friesian",
  "Gypsy Vanner",
  "Hackney",
  "Haflinger",
  "Hanoverian",
  "Highland Pony",
  "Holsteiner",
  "Icelandic Horse",
  "Irish Sport Horse",
  "Kathiawari",
  "Lipizzaner",
  "Lusitano",
  "Marwari",
  "Miniature Horse",
  "Missouri Fox Trotter",
  "Morgan",
  "Mustang",
  "New Forest Pony",
  "Oldenburg",
  "Paso Fino",
  "Percheron",
  "Peruvian Paso",
  "Rocky Mountain Horse",
  "Shetland Pony",
  "Shire",
  "Standardbred",
  "Suffolk Punch",
  "Tennessee Walking Horse",
  "Thoroughbred",
  "Trakehner",
  "Welsh Pony",
  "Other",
] as const;
