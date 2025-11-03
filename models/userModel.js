import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    // Basic User Info
    name: { type: String,  },
    email: { type: String,  unique: true },
    phone: { type: String,required: true,  unique: true },
    isVerified: { type: Boolean, default: false },

    // OTP / Auth Tracking
    lastOtp: { type: String },
    otpRequestedAt: { type: Date },
    otpAttempts: { type: Number, default: 0 },

    // Device Information
    deviceId: { type: String,  },
    deviceType: { type: String,  },
    deviceModel: { type: String,  },
    deviceOs: { type: String,  },
    deviceOsVersion: { type: String,  },
    deviceBrowser: { type: String,  },
    deviceBrowserVersion: { type: String,  },
    deviceIp: { type: String,  },
    deviceMacAddress: { type: String,  index: true },

    // Assigned Plan (current active one)
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },

    // Live Usage Tracking
    dataUsedMB: { type: Number, default: 0 },
    timeUsedMinutes: { type: Number, default: 0 },

    // When plan started and expires
    planStartTime: { type: Date },
    planExpiryTime: { type: Date },

    // Captive Portal / Radius / Router Integration
    sessionId: { type: String },   // Mikrotik session-id / Radius session-id
    apMacAddress: { type: String }, // connected access point
    gatewayIp: { type: String },

    // Free Trial Tracking
    freeMinutesAllowed: { type: Number, default: 0 },
    freeDataAllowed: { type: Number, default: 0 },
    freeMinutesUsed: { type: Number, default: 0 },
    freeDataUsed: { type: Number, default: 0 },

    // Account status
    isSessionActive: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },  // admin blacklisted user
    blockReason: { type: String },

    // Last activity
    lastConnectionTime: { type: Date },
    lastLogin: { type: Date },

    // Compliance
    acceptedTerms: { type: Boolean, default: false },
    marketingOptIn: { type: Boolean, default: false }

}, { timestamps: true });

userSchema.index({ phone: 1 });
userSchema.index({ deviceMacAddress: 1 });
userSchema.index({ sessionId: 1 });

export default mongoose.model("User", userSchema);
