import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlenght: 300,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

friendRequestSchema.index({ from: 1 });

friendRequestSchema.index({ to: 1 });


const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;