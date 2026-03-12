import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    // Chứa thông tin cho chat nhóm
    group: {
      name: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
      admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    // Snippet tin nhắn cuối cùng để hiển thị ở danh sách chat
    lastMessage: {
      content: { type: String, default: "" },
      createdAt: { type: Date },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Dùng Map để lưu số tin chưa đọc (Key: User ID, Value: Số lượng)
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;