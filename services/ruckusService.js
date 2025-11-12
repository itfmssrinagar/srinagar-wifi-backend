
import axios from "axios";
import https from "https";
import dotenv from "dotenv";
import fs from "fs";
import User from "../models/userModel.js";
import { count } from "console";
dotenv.config();


/* -------------------------------------------------
| CONFIGURATION
|--------------------------------------------------*/
const ROUTER_API_URL = process.env.ROUTER_API_URL; // e.g. https://<ip>:8443/wsg/api/public/v11_1
const ROUTER_API_CERTIFICATE = process.env.ROUTER_API_CERTIFICATE; // path to .pem file
const ROUTER_USERNAME = process.env.ROUTER_USERNAME || "admin";
const ROUTER_PASSWORD = process.env.ROUTER_PASSWORD || "password";

/* -------------------------------------------------
| HTTPS AGENT (Handles SSL Certs)
|--------------------------------------------------*/
let httpsAgent;
if (ROUTER_API_CERTIFICATE && fs.existsSync(ROUTER_API_CERTIFICATE)) {
  const caCert = fs.readFileSync(ROUTER_API_CERTIFICATE);
  httpsAgent = new https.Agent({
    ca: caCert,
    rejectUnauthorized: true,
  });
  console.log("✅ Loaded SmartZone certificate:", ROUTER_API_CERTIFICATE);
} else {
  console.warn("⚠️ Certificate not found — using rejectUnauthorized:false (dev only)");
  httpsAgent = new https.Agent({ rejectUnauthorized: false });
}

/* -------------------------------------------------
| 1️⃣ CREATE SERVICE TICKET
|--------------------------------------------------*/
export const createServiceTicket = async () => {
  try {
    const res = await axios.post(
      `${ROUTER_API_URL}/serviceTicket`,
      { username: ROUTER_USERNAME, password: ROUTER_PASSWORD },
      { headers: { "Content-Type": "application/json" }, httpsAgent }
    );

    console.log("✅ Service ticket created:", res.data);
    return res.data.serviceTicket || res.data.ticket;
  } catch (err) {
    console.error("❌ Service ticket creation error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 2️⃣ DELETE SERVICE TICKET
|--------------------------------------------------*/
export const deleteServiceTicket = async (ticket) => {
  try {
    const res = await axios.delete(`${ROUTER_API_URL}/serviceTicket`, {
      headers: { "Content-Type": "application/json" },
      data: { serviceTicket: ticket },
      httpsAgent,
    });

    console.log("🗑️ Service ticket deleted:", res.status);
    return res.status === 200;
  } catch (err) {
    console.error("❌ Delete ticket error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 3️⃣ LOGIN SESSION
|--------------------------------------------------*/
export const loginSession = async () => {
  try {
    const res = await axios.post(
      `${ROUTER_API_URL}/session`,
      { username: ROUTER_USERNAME, password: ROUTER_PASSWORD },
      { headers: { "Content-Type": "application/json" }, httpsAgent }
    );

    const cookie = res.headers["set-cookie"]?.[0];
    console.log("✅ Logged in successfully");
    return { cookie, data: res.data };
  } catch (err) {
    console.error("❌ Login error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 4️⃣ GET SESSION INFO
|--------------------------------------------------*/
export const getSessionInfo = async (cookie) => {
  try {
    const res = await axios.get(`${ROUTER_API_URL}/session`, {
      headers: { "Content-Type": "application/json", Cookie: cookie },
      httpsAgent,
    });

    console.log("📡 Session Info:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Session info error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 5️⃣ LOGOUT SESSION
|--------------------------------------------------*/
export const logoutSession = async (cookie) => {
  try {
    const res = await axios.delete(`${ROUTER_API_URL}/session`, {
      headers: { "Content-Type": "application/json", Cookie: cookie },
      httpsAgent,
    });

    console.log("👋 Logged out successfully");
    return res.status === 200;
  } catch (err) {
    console.error("❌ Logout error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 6️⃣ GET ONLINE USERS
|--------------------------------------------------*/
export const getOnlineUsers = async (ticketOrCookie) => {
  try {
    let headers = { "Content-Type": "application/json" };

    if (ticketOrCookie) {
      // if service ticket → use query param, else assume cookie
      if (ticketOrCookie.startsWith("ST-")) {
        const res = await axios.get(`${ROUTER_API_URL}/user/profile?serviceTicket=${ticketOrCookie}`, {
          headers,
          httpsAgent,
        });
        console.log("📡 Online Users:", res.data);
        return res.data;
      } else {
        headers.Cookie = ticketOrCookie;
      }
    }

    const res = await axios.get(`${ROUTER_API_URL}/user/profile`, { headers, httpsAgent });
    console.log("📡 Online Users:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Get online users error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 7️⃣ GET ZONES
|--------------------------------------------------*/
export const getZone = async (cookie) => {
  try {
    
    console.log("zone : "+cookie);
    
    const res = await axios.get(`${ROUTER_API_URL}/rkszones`, {
      headers: { "Content-Type": "application/json", Cookie: cookie },
      httpsAgent,
    });

    console.log("📡 Zones fetched:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Get Zone error:", err.response?.data || err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 8️⃣ GET WLAN USERS (Clients)
|--------------------------------------------------*/
export const getWlanUser = async (cookies) => {
  try {
    const body = {
      filters: [{ type: "WLAN", value: "5" }],
      fullTextSearch: { type: "AND", value: "" },
    };
        
    const res = await axios.post(
      `${ROUTER_API_URL}/query/client`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies, // ✅ this is the correct way
        },
        httpsAgent,
      }
    ); 

    console.log("📡 WLAN Users fetched:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Get WLAN User error:", err.response?.data || err.message);
    throw err;
  }
};


/* -------------------------------------------------
| 9️⃣ TEST FULL FLOW
|--------------------------------------------------*/
export const testSmartZoneFlow = async () => {
  try {
    const ticket = await createServiceTicket();
    const { cookie } = await loginSession();
    await getSessionInfo(cookie);
    const zones = await getZone(cookie);
    const users = await getWlanUser(ticket);
    await logoutSession(cookie);
    await deleteServiceTicket(ticket);

    console.log("✅ SmartZone flow completed successfully");
    return { zones, users };
  } catch (err) {
    console.error("💥 SmartZone flow failed:", err.message);
    throw err;
  }
};

/* -------------------------------------------------
| 🔟 UPSERT USERS BY MAC
/** */
export const upsertUsersByMac = async (macUsers = []) => {
  if (!Array.isArray(macUsers) || macUsers.length === 0) {
    throw new Error("Invalid or empty MAC user array.");
  }

  const operations = macUsers.map((user) => ({
    updateOne: {
      filter: { clientMac: user.clientMac },
      update: {
        $set: {
          // Basic Info
          name: user.name,
          phone: user.phone,
          hostname: user.hostname,
          deviceType: user.deviceType,
          osType: user.osType,
          osVendorType: user.osVendorType,
          modelName: user.modelName,

          // Network Info
          ipAddress: user.ipAddress,
          ipv6Address: user.ipv6Address,
          apMac: user.apMac,
          apName: user.apName,
          ssid: user.ssid,
          vlan: user.vlan,
          channel: user.channel,

          // Auth Info
          status: user.status,
          authStatus: user.authStatus,
          authMethod: user.authMethod,
          encryptionMethod: user.encryptionMethod,
          userRoleName: user.userRoleName,
          userRoleId: user.userRoleId,

          // Traffic Info
          txBytes: user.txBytes,
          rxBytes: user.rxBytes,
          totalBytes: (user.txBytes || 0) + (user.rxBytes || 0),
          uplinkRate: user.uplinkRate,
          downlinkRate: user.downlinkRate,
          txRatebps: user.txRatebps,
          medianTxMCSRate: user.medianTxMCSRate,
          medianRxMCSRate: user.medianRxMCSRate,

          // Signal Info
          rssi: user.rssi,
          snr: user.snr,
          radioType: user.radioType,

          // Session Info
          sessionStartTime: user.sessionStartTime
            ? new Date(user.sessionStartTime)
            : undefined,
          lastSeen: new Date(),
          zoneId: user.zoneId,
          zoneVersion: user.zoneVersion,
          bssid: user.bssid,

          // Other
          controlPlaneName: user.controlPlaneName,
          dataPlaneName: user.dataPlaneName,
          online: user.status === "AUTHORIZED",
        },
      },
      upsert: true,
    },
  }));

  const result = await User.bulkWrite(operations, { ordered: false });
  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
    upserted: result.upsertedCount,
  };
};

export const getUsers = async (filters = {}) => {
  const {
    ssid,
    status,
    mac,
    search,
    page = 1,
    limit = 20,
    sortBy = "lastSeen",
    order = "desc",
  } = filters;

  const query = {};

  if (ssid) query.ssid = ssid;
  if (status) query.status = status.toUpperCase();
  if (mac) query.clientMac = new RegExp(mac, "i");
  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { phone: new RegExp(search, "i") },
      { hostname: new RegExp(search, "i") },
      { clientMac: new RegExp(search, "i") },
    ];
  }

  const skip = (page - 1) * limit;
  const sortOrder = order === "asc" ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};


/* -------------------------------------------------
| 10️⃣ SELF TEST (optional)
|--------------------------------------------------*/
if (process.argv[1].includes("ruckusService.js")) {
  testSmartZoneFlow();
}
