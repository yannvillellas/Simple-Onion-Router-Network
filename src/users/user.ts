import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";

let lastReceivedMessage: string | null = null;
let lastSentMessage: string | null = null;

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  _user.get("/status", (req, res) => {
    res.send("live");
  });
  
  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  _user.post("/message", (req, res) => {
    const { message } = req.body;
    if (!message) {
      res.send("Message is required");
      return;
    }
    lastReceivedMessage = message;
    console.log(`User ${userId} received message: ${message}`);
    res.send("success");
  });

  _user.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId } = req.body;
    if (!message || destinationUserId === undefined) {
      res.json({ error: "Message and destinationUserId are required" });
      return;
    }
    try {
      await fetch(`http://localhost:${BASE_USER_PORT + destinationUserId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message }),
      });
      lastSentMessage = message;
      return res.send("success");
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}

async function sendMessage(userPort: number, message: string) {
  await fetch(`http://localhost:${userPort}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
}
