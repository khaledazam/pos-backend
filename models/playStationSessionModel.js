const mongoose = require("mongoose");

const playStationSessionSchema = new mongoose.Schema(
    {
        playStationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlayStation",
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        durationMinutes: {
            type: Number,
            default: 0,
        },
        pricePerHourSnapshot: {
            type: Number,
            required: true, // Capture price at start of session to avoid issues if price changes mid-session
        },
        totalPrice: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PlayStationSession", playStationSessionSchema);
