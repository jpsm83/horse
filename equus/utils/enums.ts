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

export const accountTypeEnums = [
  "owner",
  "stable",
  "trainer",
  "veterinary",
  "breeder",
  "ridingClub",
  "transport",
  "coach",
  "horse",
] as const;

export const relationshipTypeEnums = [
  "stable",
  "trainer",
  "veterinary",
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

export const saleStatusEnums = ["not_for_sale", "for_sale"] as const;

export const horseSubscriptionStatusEnums = [
  "trial",
  "active_paid",
  "past_due",
  "canceled",
] as const;

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
