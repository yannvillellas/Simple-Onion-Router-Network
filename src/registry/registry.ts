import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";
import { exportPrvKey, exportPubKey, generateRsaKeyPair } from "../crypto";

let registry: { nodes: Node[] } = { nodes: [] };

export type Node = { nodeId: number; pubKey: string; prvKey: string};

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  _registry.get("/status", (req, res) => {
    res.send("live");
  });

  _registry.post("/registerNode", async (req, res) => {
    const nodeId = req.body.nodeId;
    if (registry.nodes.find((node) => node.nodeId === nodeId)) {
      res.json({ error: `Node ${nodeId} already registered` });
      return;
    }
    const {privateKey, publicKey} = await generateRsaKeyPair();
    const node: Node = {
      nodeId,
      pubKey: await exportPubKey(publicKey),
      prvKey: await exportPrvKey(privateKey)
    };
    registry.nodes.push(node);
    res.json({nodeId});
  });

  _registry.get("/getPrivateKey/:nodeId", async (req, res) => {
    const nodeId = parseInt(req.params.nodeId, 10);
    const node = registry.nodes.find((n) => n.nodeId === nodeId);
    if (!node) {
      res.json({ error: `Node ${nodeId} not found` });
      return;
    }
    if (!node.prvKey) {
      res.json({ error: "Failed to export private key" });
      return;
    }
    res.status(200).json({ result: node.prvKey });
  });

  _registry.get("/getNodeRegistry", (req, res) => {
    const nodes = registry.nodes.map((node) => {
      return {
        nodeId: node.nodeId,
        pubKey: node.pubKey,
      };
    });
    res.json({nodes});
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
