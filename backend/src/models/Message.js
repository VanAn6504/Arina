import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      default: "",
    },
    imgUrl: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Đánh index để tối ưu hóa tốc độ load lịch sử chat
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;