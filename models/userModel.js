import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🧍 Basic Info
    name: { type: String },
    phone: { type: String, unique: true },

    // 📡 Device Info (from Ruckus)
    hostname: { type: String },
    deviceType: { type: String },         // e.g. "Smartphone"
    osType: { type: String },             // e.g. "Android 10.0.0"
    osVendorType: { type: String },       // e.g. "Android"
    modelName: { type: String },          // e.g. "OPPO Reno13 5G"

    // 🌐 Network Info
    clientMac: { type: String, index: true },  // Device MAC
    ipAddress: { type: String },
    ipv6Address: { type: String },
    apMac: { type: String },
    apName: { type: String },
    ssid: { type: String },
    vlan: { type: Number },
    channel: { type: Number },

    // 🔐 Authentication
    status: { type: String, enum: ["AUTHORIZED", "UNAUTHORIZED", "BLOCKED"], default: "UNAUTHORIZED" },
    authStatus: { type: String },
    authMethod: { type: String },
    encryptionMethod: { type: String },
    userRoleName: { type: String },
    userRoleId: { type: String },

    // 📊 Traffic Usage
    txBytes: { type: Number, default: 0 }, // Uploaded
    rxBytes: { type: Number, default: 0 }, // Downloaded
    totalBytes: { type: Number, default: 0 }, // Sum of both
    uplinkRate: { type: Number },
    downlinkRate: { type: Number },
    txRatebps: { type: Number },
    medianTxMCSRate: { type: Number },
    medianRxMCSRate: { type: Number },

    // 📶 Signal Info
    rssi: { type: Number },
    snr: { type: Number },
    radioType: { type: String },

    // 🕒 Session Info
    sessionStartTime: { type: Date },
    lastSeen: { type: Date, default: Date.now },
    zoneId: { type: String },
    zoneVersion: { type: String },
    bssid: { type: String },

    // ⚙️ Extra
    controlPlaneName: { type: String },
    dataPlaneName: { type: String },

    // 📈 Derived Fields (optional)
    online: { type: Boolean, default: false },  // computed from Ruckus
  },
  { timestamps: true }
);

// 🧠 Index for faster search
userSchema.index({ clientMac: 1 });
userSchema.index({ ssid: 1 });
userSchema.index({ status: 1 });
userSchema.index({ phone: 1 });

export default mongoose.model("User", userSchema);
