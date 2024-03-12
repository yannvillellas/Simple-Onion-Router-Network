import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";

let lastReceivedEncryptedMessage: string | null = null;
let lastReceivedDecryptedMessage: string | null = null;
let lastMessageDestination: number | null = null;

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  onionRouter.get("/status", (req, res) => {
    res.send('live');
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });
  
  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });

  onionRouter.get("/getPrivateKey", async (req, res) => {
    const response = await fetch(
      `http://localhost:${REGISTRY_PORT}/getPrivateKey/${nodeId}`
    );
    const data = await response.json();
    res.status(response.status).json(data);
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}

export async function registerNodesOnRegistry(n: number) {
  for (let nodeId = 0; nodeId < n; nodeId++) {
    const response = await fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({nodeId}),
    });
    if (!response.ok) {
      console.error(`Failed to register node ${nodeId} on the registry`, response.status);
    }
  }
}
