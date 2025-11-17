// socketService.js
import { Server } from "socket.io";
import { disconnectClient, getWlanUser, loginSession, upsertUsersByMac } from "./ruckusService.js";

let io;
let cachedSession = null; // 🔒 Cache SmartZone session
let lastLoginTime = 0;
const SESSION_TTL = 5 * 60 * 100; // 5 minutes

// 🧠 Helper: Get valid Ruckus session cookie
const getValidSession = async () => {
  const now = Date.now();
  if (cachedSession && now - lastLoginTime < SESSION_TTL) {
    return cachedSession;
  }

  console.log("🔑 Creating new SmartZone session...");
  try {
    const session = await loginSession();
    cachedSession = session?.cookie;
    lastLoginTime = now;
    return cachedSession;
  } catch (err) {
    console.error("❌ Failed to create SmartZone session:", err.message);
    cachedSession = null;
    throw err;
  }
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    const sendUpdates = async () => {
      try {
        // 1️⃣ Ensure session is valid
        const cookie = await getValidSession();
        if (!cookie) throw new Error("No valid SmartZone session available");

        // 2️⃣ Fetch WLAN user list
        const onlineUsers = await getWlanUser(cookie);
        const clients = onlineUsers?.list || onlineUsers || [];

        console.log(`📡 SmartZone returned ${clients.length} clients`);

        // 3️⃣ Sync users to DB
        if (clients.length > 0) {
          const result = await upsertUsersByMac(clients);
          console.log(
            `🧩 DB Sync → Matched: ${result.matched}, Modified: ${result.modified}, New: ${result.upserted}`
          );
        }

        const data = await disconnectClient(cookie);
        console.log("disconnect data : "+data);
        


        // 4️⃣ Emit live user data to frontend
        socket.emit("onlineUsers", clients);
      } catch (err) {
        console.error("🚨 Socket update failed:", err.message);
      }
    };

    // 🔁 Update every 45 sec
    const interval = setInterval(sendUpdates, 45000);
    sendUpdates(); // Run once immediately

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
      clearInterval(interval);
    });
  });

  console.log("✅ Socket.io initialized");
};

// 🔄 Getter
export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
