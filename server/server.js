//server.js
import express from "express";
import sequelize from './config/PostgreSQL_db.js';
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import universityRoutes from "./routes/universityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import accommodationRoutes from "./routes/accommodationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from './routes/messageRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';

import PostgreSQLRoutes from "./routes/PostgreSQLRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// const HOST = process.env.HOST || "localhost";
const HOST =  "0.0.0.0"; // 👈 Allow connections from all network interfaces
// 🟢 CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
];
const corsOptions = {
  origin: allowedOrigins,// ['http://kooshaportfolio.work.gd:5173'],//['https://mycampushome.netlify.app', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Enable credentials (cookies, authorization headers, etc)
  optionsSuccessStatus: 200
};

// Middleware applied to all routes
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// PostgreSQL Sync models
sequelize.authenticate()
  .then(() => sequelize.sync({ alter: true }))
  .then(() => console.log('Postgres connected & models synced'))
  .catch(console.error);

// Routes
app.use("/api", PostgreSQLRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);




// Set up the HTTP server and Socket.IO
const server = http.createServer(app); // `app` is your Express app instance
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Adjust based on your frontend's URL
    // origin: 'http://localhost:5173', // Adjust based on your frontend's URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('sendMessage', (messageData) => {
    socket.to(messageData.receiver).emit('receiveMessage', messageData);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
