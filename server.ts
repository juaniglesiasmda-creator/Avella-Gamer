import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { EventState } from "./src/types";

const PORT = 3000;
const STATE_FILE_PATH = path.join(process.cwd(), "data", "event-state.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure data folder and uploads folder exist
try {
  const folders = [path.join(process.cwd(), "data"), UPLOADS_DIR];
  folders.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
} catch (error) {
  console.warn("Error al inicializar directorios:", error);
}

// Default state to populate beautifully on start
const defaultState: EventState = {
  eventTitle: "VACACIONES DE INVIERNO",
  eventSubtitle: "Estadio Playstation & Zona Fichines - Avellaneda",
  eventLogoUrl: "", // Empty means using standard dynamic svg gamepad/logo
  qrVisible: true,
  backgroundTheme: "winter-avellaneda",
  activeAnnouncement: null,
  schedules: [
    {
      id: "tourney-1",
      gameName: "Torneo EA Sports FC 24",
      gameLogo: "fifa",
      time: "13:00",
      date: "Sábado 20/07",
      status: "completed",
      statusLabel: "COMPLETADO",
      platform: "PS5",
      players: "1v1",
      prize: "Medalla + Kit Gamer",
      room: "ESTADIO PLAYSTATION",
      color: "blue"
    },
    {
      id: "tourney-2",
      gameName: "Desafío de Fórmula 1",
      gameLogo: "rocket",
      time: "15:00",
      date: "Cada Tarde",
      status: "active",
      statusLabel: "¡EN CURSO!",
      platform: "PC",
      players: "Time Attack",
      prize: "Remera Oficial + Merch",
      room: "SIMULADORES DE CARRERAS",
      color: "rose"
    },
    {
      id: "tourney-3",
      gameName: "Inscripciones Copa Fichines Retro",
      gameLogo: "custom",
      time: "16:30",
      date: "Domingo 21/07",
      status: "registering",
      statusLabel: "¡INSCRIPCIÓN ABIERTA!",
      platform: "Multiplataforma",
      players: "1v1 Clasificación",
      prize: "Joystick Pro + Trofeo",
      room: "ZONA FICHINES",
      color: "amber"
    },
    {
      id: "tourney-4",
      gameName: "Beat Saber VR Showdown",
      gameLogo: "custom",
      time: "18:00",
      date: "Lunes 22/07",
      status: "upcoming",
      statusLabel: "PRÓXIMO EVENTO",
      platform: "Multiplataforma",
      players: "Soles / Puntos",
      prize: "Orden de Compra $50.000",
      room: "REALIDAD VIRTUAL",
      color: "cyan"
    }
  ],
  videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-gamers-playing-in-a-cyberpunk-room-41981-large.mp4",
  videoInterval: 5,
  videoDuration: 30,
  isVideoPlaying: true,
  videoLastPlayed: Date.now()
};

// State holder
let currentState: EventState = JSON.parse(JSON.stringify(defaultState));

// Ensure data folder exists and load persisted state if available
try {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(STATE_FILE_PATH)) {
    const fileContent = fs.readFileSync(STATE_FILE_PATH, "utf8");
    currentState = JSON.parse(fileContent);
    currentState.isVideoPlaying = true; // Ensure always playing by default
  } else {
    currentState.isVideoPlaying = true;
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(currentState, null, 2), "utf8");
  }
} catch (error) {
  console.warn("No se pudo persistir el estado en archivo, se usará memoria únicamente:", error);
}

function saveStateToDisk() {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(currentState, null, 2), "utf8");
  } catch (error) {
    console.error("Error al guardar estado en disco:", error);
  }
}

async function startServer() {
  const app = express();

  // Allow high limits for base64 logo files
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve static video/media files physically uploaded by the user
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Configure multer disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const originalExtension = path.extname(file.originalname) || ".mp4";
      const filename = `broadcast-${Date.now()}${originalExtension}`;
      cb(null, filename);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 150 * 1024 * 1024 } // 150MB limit
  });

  // Receive multipart file upload up to 150MB
  app.post("/api/upload-video", upload.single("video"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No se envió ningún archivo de video." });
      }
      const relativeUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, videoUrl: relativeUrl });
    } catch (error: any) {
      console.error("Error al procesar subida de video con multer:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API: Get current state
  app.get("/api/state", (req, res) => {
    res.json(currentState);
  });

  // API: Update partial or complete state
  app.post("/api/state", (req, res) => {
    try {
      const updates = req.body;
      currentState = {
        ...currentState,
        ...updates
      };
      saveStateToDisk();
      res.json({ success: true, state: currentState });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // API: Reset state to default
  app.post("/api/state/reset", (req, res) => {
    try {
      const priorVideoUrl = currentState.videoUrl;
      currentState = JSON.parse(JSON.stringify(defaultState));
      // Preserve custom video/gif url if we have one so it stays as persistent default
      if (priorVideoUrl && (priorVideoUrl.includes("/uploads") || priorVideoUrl.includes(".gif"))) {
        currentState.videoUrl = priorVideoUrl;
        currentState.isVideoPlaying = true;
      }
      saveStateToDisk();
      res.json({ success: true, state: currentState });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Serve static UI assets or connect Dev middlewares
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ESPORTS DASHBOARD SERVER] Running at http://localhost:${PORT}`);
  });
}

startServer();
