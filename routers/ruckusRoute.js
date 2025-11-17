import express from "express";
import { 
  createServiceTicket, 
  deleteServiceTicket, 
  loginSession, 
  logoutSession, 
  getOnlineUsers, 
  getSessionInfo, 
  testSmartZoneFlow, 
  getZone,
  getWlanUser,
  getUsers,
  disconnectClient,
  disconnectClientImmediate
} from "../services/ruckusService.js";

const router = express.Router();

/*
|--------------------------------------------------
| 1) ONLINE USERS
| GET /api/ruckus/online
|--------------------------------------------------
*/
router.get("/online", async (req, res) => {
  let ticket;
  try {
    ticket = await createServiceTicket();
    const users = await getOnlineUsers(ticket);
    res.status(200).json({ success: true, onlineUsers: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });

  }
});


/*
|--------------------------------------------------
| 2) CREATE SERVICE TICKET
| POST /api/ruckus/ticket
|--------------------------------------------------
*/
router.post("/ticket", async (req, res) => {
  try {
    const ticket = await createServiceTicket();
    res.status(200).json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/*
|--------------------------------------------------
| 3) DELETE SERVICE TICKET
| DELETE /api/ruckus/ticket/:ticket
|--------------------------------------------------
*/
router.delete("/ticket/:ticket", async (req, res) => {
  try {
    await deleteServiceTicket(req.params.ticket);
    res.status(200).json({ success: true, message: "Ticket deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/*
|--------------------------------------------------
| 4) LOGIN SESSION
| POST /api/ruckus/session/login
|--------------------------------------------------
*/
router.post("/session/login", async (req, res) => {
  try {
    const { cookie, data } = await loginSession();
    res.status(200).json({ success: true, cookie, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/*
|--------------------------------------------------
| 5) GET SESSION INFO
| GET /api/ruckus/session/info
| Body/Query: cookie
|--------------------------------------------------
*/
router.get("/session/info", async (req, res) => {
  try {
    const cookie = req.headers.cookie || req.query.cookie;
    const sessionInfo = await getSessionInfo(cookie);
    res.status(200).json({ success: true, sessionInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/*
|--------------------------------------------------
| 6) LOGOUT SESSION
| DELETE /api/ruckus/session/logout
| Body/Query: cookie
|--------------------------------------------------
*/
router.delete("/session/logout", async (req, res) => {
  try {
    const cookie = req.headers.cookie || req.query.cookie;
    await logoutSession(cookie);
    res.status(200).json({ success: true, message: "Session logged out" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/*
|--------------------------------------------------
| 7) FULL SMARTZONE TEST FLOW
| GET /api/ruckus/test-flow
|--------------------------------------------------
*/
router.get("/test-flow", async (req, res) => {
  try {
    await testSmartZoneFlow();
    res.status(200).json({ success: true, message: "SmartZone flow test completed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/*--------------------------------------------------
| 8) GET ZONES
| GET /api/ruckus/zones
|--------------------------------------------------
*/

router.get("/zones",async (req, res) => {
  try {
   await getZone()
    res.status(200).json({ message: "Ruckus zones endpoint" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
})

/*--------------------------------------------------
| 9) GET WLAN USERS
| POST /api/ruckus/users
|--------------------------------------------------
*/
router.post("/users",async (req, res) => {
  try {
    const cookies = req.headers.cookie;
    
   const data =  await getWlanUser(cookies)
    res.status(200).json({ message: "Ruckus zones endpoint", data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
})


/*--------------------------------------------------
| 10) GET DB USERS
| POST /api/ruckus/users
|--------------------------------------------------
*/

router.get("/db-users",async (req, res) => {
  try {
    const data = await getUsers();
    res.status(200).json({ message: "DB Users fetched", data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
})
router.post("/disconnectclients",async (req, res) => {
  try {
    const cookies = "JSESSIONID=sM1F8FQRuju1etHb0aLLlrrLzLcW4ddD; Path=/wsg; Secure; HttpOnly;"
    console.log("cookies : "+cookies);
    const data = await disconnectClient(cookies);
    res.status(200).json({ message: "disconnect Client", data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
})

router.post("/disconnectclient",async (req, res) => {
  try {
    const requestBody = req.body;
    const cookies = "JSESSIONID=sM1F8FQRuju1etHb0aLLlrrLzLcW4ddD; Path=/wsg; Secure; HttpOnly;"
    console.log("cookies : "+cookies);
    const data = await disconnectClientImmediate(requestBody,cookies);
    res.status(200).json({ message: "disconnect Client", data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
})

export default router;
