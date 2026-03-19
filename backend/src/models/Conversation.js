import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  }
);

const lastMessageSchema = new mongoose.Schema(
  {
    _id: { type: String },
    content: {
      type: String,
      default: null,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: {
      type: [participantSchema],
      required: true,
    },
    group: {
      type: groupSchema,
    },
    lastMessageAt: {
      type: Date,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },
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

conversationSchema.index({
  "participants.userId": 1, //cai nay co s hay ko s day
  // "participant.userId": 1,
  lastMessageAt: -1,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;



// import mongoose from "mongoose";

// const participantSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     joinedAt: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   {
//     _id: false,
//   }
// );


// const groupSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       trim: true,
//     },
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     avatarUrl: { type: String, default: "" },
//   },
//   {
//     _id: false,
//   }
// );

// const lastMessageSchema = new mongoose.Schema(
//   {
//     _id: { type: String },
//     content: {
//       type: String,
//       default: null,
//     },
//     senderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     createdAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     _id: false,
//   }
// );

// const conversationSchema = new mongoose.Schema(
//   {
//     participants: [ //ng trong cuộc trò truyện
//       {
//         type: [participantSchema],
//         // ref: "User",
//         required: true,
//       },
//     ],
//     type: {
//       type: String,
//       enum: ["direct", "group"],
//       required: true,
//     },
//     // Chứa thông tin cho chat nhóm
//     group: {
//         type: groupSchema,
//     },

//     lastMessageAt: {
//       type: Date,
//     },

//     // Snippet tin nhắn cuối cùng để hiển thị ở danh sách chat
//     seenBy: [ //1 mảng
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     lastMessage: {
//       type: lastMessageSchema,
//       default: null,
//     },
    
//     // Dùng Map để lưu số tin chưa đọc 
//     unreadCounts: {
//       type: Map,
//       of: Number,
//       default: {},
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// conversationSchema.index({ //bảng tra cứu nhanh sx theo ng tham gia, tin nhắn ms nhất nằm trên cùng và sx lastMes giảm dần
//   "participants.userId": 1, //cai nay co s hay ko s day
//   // "participant.userId": 1,
//   lastMessageAt: -1,
// });

// const Conversation = mongoose.model("Conversation", conversationSchema);
// export default Conversation;
