import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User",
        index: true
    },
    chatHistory: [
        {
            role: {
                type: String,
                required: true,
                enum: ["user", "model", "system"]
            },
            content: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        }
    ]

}, {timestamps: true});

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);


export default Chat;
