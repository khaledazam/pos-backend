const mongoose = require("mongoose");

const playStationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["PS4", "PS5"],
        },
        status: {
            type: String,
            required: true,
            enum: ["available", "occupied", "maintenance"],
            default: "available",
        },
        pricePerHour: {
            type: Number,
            required: true,
            default: 0,
        },
        currentSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlayStationSession",
            default: null,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("PlayStation", playStationSchema);
