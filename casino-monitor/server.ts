import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import solace from "solclientjs";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3010;

// Solace Configuration
const solaceConfig = {
  url: process.env.SOLACE_HOST || "",
  vpnName: process.env.SOLACE_VPN || "",
  userName: process.env.SOLACE_USERNAME || "",
  password: process.env.SOLACE_PASSWORD || "",
};

let solaceSession: any = null;

const initSolace = () => {
  const factoryProps = new solace.SolclientFactoryProperties();
  factoryProps.profile = solace.SolclientFactoryProfiles.version10;
  solace.SolclientFactory.init(factoryProps);

  try {
    solaceSession = solace.SolclientFactory.createSession({
      url: solaceConfig.url,
      vpnName: solaceConfig.vpnName,
      userName: solaceConfig.userName,
      password: solaceConfig.password,
    });

    solaceSession.on(solace.SessionEventCode.UP_NOTICE, () => {
      console.log("Solace Session is UP");
      io.emit("solace:status", "connected");
      subscribeToAudit();
    });

    solaceSession.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (event: any) => {
      console.error("Solace Connection Failed", event.infoStr);
      io.emit("solace:status", "error");
    });

    solaceSession.on(solace.SessionEventCode.DISCONNECTED, () => {
      console.log("Solace Disconnected");
      io.emit("solace:status", "disconnected");
    });

    solaceSession.on(solace.SessionEventCode.MESSAGE, (message: any) => {
      const payload = message.getBinaryAttachment() || message.getSdtContainer()?.toString();
      const topic = message.getDestination().getName();
      
      console.log(`Received message on ${topic}: ${payload}`);
      
      handleAuditMessage(payload, topic);
    });

    solaceSession.connect();
  } catch (error) {
    console.error("Error initializing Solace", error);
  }
};

const subscribeToAudit = () => {
  const topic = solace.SolclientFactory.createTopicDestination("tablegame/audit");
  try {
    solaceSession.subscribe(
      topic,
      true,
      "audit_subscription",
      10000
    );
    console.log("Subscribed to tablegame/audit");
  } catch (error) {
    console.error("Subscription failed", error);
  }
};

const handleAuditMessage = (payload: any, sourceTopic: string) => {
  const messageStr = payload.toString();
  
  // Forward to UI
  io.emit("audit:message", {
    topic: sourceTopic,
    payload: messageStr,
    timestamp: new Date().toISOString()
  });

  if (messageStr.toUpperCase().includes("HIGH RISK") || (messageStr.toUpperCase().includes("CRITICAL")) || (messageStr.toUpperCase().includes("UNUSUAL BETTING ACTIVITY"))) {
    console.log("High Risk detected! ****** Processing alert...");
    
    let tableNo = "unknown";
    try {
      // Try to parse as JSON if possible
      const data = JSON.parse(messageStr);
      console.log("High Risk detected! Table ...", messageStr);
      tableNo = data.tableNo || data.tableno || data.table_no || "000";
      // Fallback: search for a table number pattern in the string (e.g., Table 5 or Table: 07)
      try {
          const match = messageStr.match(/\*\*Table Number:\*\* [:0\s]+(\w+)/i);
          console.log("**** match token ...", match[0], ", Result1:",match[1]);
          // Temp fixed: if (match) tableNo = match[1];
          tableNo  = match[1];
      }
      catch (e) {
          const match = messageStr.match(/Table Number: \*\* [:0*\s]+(\w+)/i);
          console.log("**** Inside match token2 ...", match[0], ", Result1:",match[1]);
          // Temp fixed: if (match) tableNo = match[1];
          tableNo  = match[1];
      }
    } catch (e) {
      // Fallback: search for a table number pattern in the string (e.g., Table 5 or Table: 07)
      //const match = messageStr.match(/\*\*Table Number\*\*: [:0\s]+(\w+)/i);
      // console.log("**** match token ...", match[0], ", Result1: ",match[1]);
      // Temp fixed if (match) tableNo = match[1];
      tableNo  = "3";
    }

    const alertTopic = `tablegame/${tableNo}/alert`;
    const alertMessage = solace.SolclientFactory.createMessage();
    alertMessage.setDestination(solace.SolclientFactory.createTopicDestination(alertTopic));
    alertMessage.setBinaryAttachment(messageStr);
    alertMessage.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

    try {
      solaceSession.send(alertMessage);
      console.log(`Alert sent to ${alertTopic}`);
      io.emit("audit:alert", {
        topic: alertTopic,
        payload: messageStr,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to send alert", error);
    }
  }
};

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Only init Solace if config is provided
    if (solaceConfig.url && solaceConfig.userName) {
      initSolace();
    } else {
      console.warn("Solace configuration missing. Audit monitor not started.");
    }
  });
}

startServer();
