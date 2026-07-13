import mongoose, { Schema, model } from "mongoose";

const horseAuditLogSchema = new Schema(
  {
    horseId: { type: Schema.Types.ObjectId, ref: "Horse", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorLabel: { type: String },

    actionType: {
      type: String,
      enum: [
        "horse.created", "horse.updated",
        "relationship.created", "relationship.ended",
        "ownership.transferred", "ownership.co_owner_added",
        "ownership.co_owner_removed", "ownership.co_owner_promoted",
        "health.created", "health.updated", "health.deleted",
        "feed.created", "feed.updated", "feed.deleted",
        "event.created", "event.updated", "event.deleted",
        "media.created", "media.deleted",
        "document.created", "document.updated", "document.deleted",
      ],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

horseAuditLogSchema.index({ horseId: 1, createdAt: -1 });
horseAuditLogSchema.index({ actorId: 1 });

const HorseAuditLog = mongoose.models.HorseAuditLog || model("HorseAuditLog", horseAuditLogSchema);
export default HorseAuditLog;
