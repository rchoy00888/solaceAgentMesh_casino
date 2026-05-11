import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import solace from "solclientjs";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const PORT = 3001;

// Solace Configuration
const solaceConfig = {
  url: process.env.SOLACE_HOST || "ws://localhost:8008",
  vpnName: process.env.SOLACE_VPN || "default",
  userName: process.env.SOLACE_USERNAME || "default",
  password: process.env.SOLACE_PASSWORD || "default",
};

let solaceSession: any = null;

function initSolace() {
  if (!solaceConfig.url) {
    console.warn("Solace credentials missing. Real-time Solace features will be disabled.");
    return;
  }

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
      console.log("Solace session is UP");
      // Optionally subscribe to a default table topic
      subscribeToTopic("tablegame/bct/>");
    });

    solaceSession.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (event: any) => {
      console.error("Solace connection failed: " + event.infoStr);
    });

    solaceSession.on(solace.SessionEventCode.DISCONNECTED, () => {
      console.log("Solace session disconnected");
    });

    solaceSession.on(solace.SessionEventCode.MESSAGE, (message: any) => {
      const topic = message.getDestination().getName();
      const content = message.getBinaryAttachment() || message.getSdtContainer()?.getWebProperty();
      const payload = typeof content === "string" ? JSON.parse(content) : content;

      console.log(`Received message on topic ${topic}:`, payload);
      
      // Relay to all connected websocket clients
      io.emit("solace-message", {
        topic,
        payload
      });
    });

    solaceSession.connect();
  } catch (error) {
    console.error("Error initializing Solace:", error);
  }
}

function subscribeToTopic(topicName: string) {
  if (!solaceSession) return;
  try {
    const topic = solace.SolclientFactory.createTopicDestination(topicName);
    solaceSession.subscribe(
      topic,
      true, // request confirmation
      topicName, // correlation key
      10000 // 10 seconds timeout
    );
    console.log(`Subscribed to topic: ${topicName}`);
  } catch (error) {
    console.error(`Failed to subscribe to topic ${topicName}:`, error);
  }
}

function publishToTopic(topicName: string, payload: any) {
  if (!solaceSession) {
    // Mock response if no solace
    setTimeout(() => {
      io.emit("solace-message", {
        topic: "results/1",
        payload: {
          ...payload,
          status: "win",
          payout: payload.betAmount * 2,
          message: "Real Solace server not configured. This is a mock result."
        }
      });
    }, 1000);
    return;
  }

  try {
    const topic = solace.SolclientFactory.createTopicDestination(topicName);
    const message = solace.SolclientFactory.createMessage();
    message.setDestination(topic);
    message.setBinaryAttachment(JSON.stringify(payload));
    message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
    console.error(`*** Ready  to publish message to topic ${topicName}:`);

    solaceSession.send(message);
    console.log(`Published message to topic ${topicName}:`, payload);
  } catch (error) {
    console.error(`Failed to publish message to topic ${topicName}:`, error);
  }
}

initSolace();

app.use(express.json());

// API Routes
app.post("/api/bet", (req, res) => {
  const { tableNo, userID, betAmount, dealerID, winlose, timestamp } = req.body;
  if (!tableNo || !userID || !betAmount || !dealerID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const topicName = `tablegame/bct/${tableNo}`;
  const payload = { userID, betAmount, tableNo, dealerID, winlose, timestamp };

  publishToTopic(topicName, payload);
  res.json({ status: "Bet submitted", topic: topicName });
});

// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
