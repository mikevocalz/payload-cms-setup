/**
 * Socket.IO Signaling Server for WebRTC Video Calls
 *
 * Handles:
 * - JWT authentication on connection
 * - Room management for 1:1 and group calls
 * - WebRTC signaling (offer/answer/ICE candidates)
 * - Speaker state management
 *
 * Architecture inspired by:
 * - https://medium.com/@ashraz.developer/building-a-cross-platform-video-chat-app-with-react-native-webrtc-and-socket-io-b8fcb598805c
 * - https://github.com/aaronksaunders/payload-websockets-1-2025
 */

import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "http";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.PAYLOAD_SECRET || "your-secret-key";

interface CallRoom {
  id: string;
  createdBy: string;
  participants: Map<string, ParticipantInfo>;
  isGroup: boolean;
  speakerId: string | null;
  createdAt: Date;
}

interface ParticipantInfo {
  oderId: string;
  username: string;
  socketId: string;
  isMuted: boolean;
  isVideoOff: boolean;
  joinedAt: Date;
}

interface JWTPayload {
  id: number;
  email: string;
  collection: string;
}

// In-memory room storage (use Redis for production scaling)
const callRooms = new Map<string, CallRoom>();

// User to socket mapping
const userSockets = new Map<string, string>();

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // JWT Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("[Socket] Connection rejected: No token provided");
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      socket.data.userId = String(decoded.id);
      socket.data.email = decoded.email;
      console.log("[Socket] User authenticated:", decoded.id);
      next();
    } catch (error) {
      console.log("[Socket] Connection rejected: Invalid token");
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    console.log("[Socket] User connected:", userId, "Socket:", socket.id);

    // Track user's socket
    userSockets.set(userId, socket.id);

    // ==================== CALL EVENTS ====================

    /**
     * Create a new call room
     * @param data.roomId - Unique room identifier
     * @param data.isGroup - Whether this is a group call
     * @param data.participantIds - Initial participant user IDs to invite
     */
    socket.on(
      "call:create",
      (data: {
        roomId: string;
        isGroup: boolean;
        participantIds: string[];
      }) => {
        const { roomId, isGroup, participantIds } = data;
        console.log("[Socket] call:create", {
          roomId,
          isGroup,
          participantIds,
          creator: userId,
        });

        if (callRooms.has(roomId)) {
          socket.emit("call:error", { error: "Room already exists" });
          return;
        }

        const room: CallRoom = {
          id: roomId,
          createdBy: userId,
          participants: new Map(),
          isGroup,
          speakerId: userId, // Creator is initial speaker
          createdAt: new Date(),
        };

        // Add creator as first participant
        room.participants.set(userId, {
          oderId: userId,
          username: socket.data.email?.split("@")[0] || "user",
          socketId: socket.id,
          isMuted: false,
          isVideoOff: false,
          joinedAt: new Date(),
        });

        callRooms.set(roomId, room);
        socket.join(roomId);

        // Notify creator
        socket.emit("call:created", {
          roomId,
          isGroup,
          speakerId: userId,
          participants: Array.from(room.participants.entries()).map(
            ([id, info]) => ({
              oderId: id,
              username: info.username,
              isMuted: info.isMuted,
              isVideoOff: info.isVideoOff,
            }),
          ),
        });

        // Send invitations to other participants
        participantIds.forEach((participantId) => {
          if (participantId !== userId) {
            const participantSocketId = userSockets.get(participantId);
            if (participantSocketId) {
              io.to(participantSocketId).emit("call:incoming", {
                roomId,
                callerId: userId,
                isGroup,
              });
            }
          }
        });

        console.log("[Socket] Room created:", roomId);
      },
    );

    /**
     * Join an existing call room
     */
    socket.on("call:join", (data: { roomId: string }) => {
      const { roomId } = data;
      console.log("[Socket] call:join", { roomId, oderId: userId });

      const room = callRooms.get(roomId);
      if (!room) {
        socket.emit("call:error", { error: "Room not found" });
        return;
      }

      // Add participant to room
      room.participants.set(userId, {
        oderId: userId,
        username: socket.data.email?.split("@")[0] || "user",
        socketId: socket.id,
        isMuted: false,
        isVideoOff: false,
        joinedAt: new Date(),
      });

      socket.join(roomId);

      // Notify all participants about new joiner
      socket.to(roomId).emit("call:participant:joined", {
        oderId: userId,
        username: socket.data.email?.split("@")[0] || "user",
      });

      // Send room state to joiner
      socket.emit("call:joined", {
        roomId,
        speakerId: room.speakerId,
        participants: Array.from(room.participants.entries()).map(
          ([id, info]) => ({
            oderId: id,
            username: info.username,
            isMuted: info.isMuted,
            isVideoOff: info.isVideoOff,
          }),
        ),
      });

      console.log(
        "[Socket] User joined room:",
        roomId,
        "Total participants:",
        room.participants.size,
      );
    });

    /**
     * Leave a call room
     */
    socket.on("call:leave", (data: { roomId: string }) => {
      const { roomId } = data;
      handleLeaveRoom(socket, roomId, userId, io);
    });

    /**
     * WebRTC Offer
     */
    socket.on(
      "call:offer",
      (data: {
        roomId: string;
        targetUserId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        const { roomId, targetUserId, offer } = data;
        console.log("[Socket] call:offer from", userId, "to", targetUserId);

        const targetSocketId = userSockets.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:offer", {
            roomId,
            fromUserId: userId,
            offer,
          });
        }
      },
    );

    /**
     * WebRTC Answer
     */
    socket.on(
      "call:answer",
      (data: {
        roomId: string;
        targetUserId: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        const { roomId, targetUserId, answer } = data;
        console.log("[Socket] call:answer from", userId, "to", targetUserId);

        const targetSocketId = userSockets.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:answer", {
            roomId,
            fromUserId: userId,
            answer,
          });
        }
      },
    );

    /**
     * WebRTC ICE Candidate
     */
    socket.on(
      "call:ice-candidate",
      (data: {
        roomId: string;
        targetUserId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        const { roomId, targetUserId, candidate } = data;

        const targetSocketId = userSockets.get(targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("call:ice-candidate", {
            roomId,
            fromUserId: userId,
            candidate,
          });
        }
      },
    );

    /**
     * Add participant to existing call
     */
    socket.on(
      "call:add-participant",
      (data: { roomId: string; participantId: string }) => {
        const { roomId, participantId } = data;
        console.log("[Socket] call:add-participant", { roomId, participantId });

        const room = callRooms.get(roomId);
        if (!room) {
          socket.emit("call:error", { error: "Room not found" });
          return;
        }

        // Only creator or existing participants can add
        if (!room.participants.has(userId)) {
          socket.emit("call:error", {
            error: "Not authorized to add participants",
          });
          return;
        }

        // Send invitation to new participant
        const participantSocketId = userSockets.get(participantId);
        if (participantSocketId) {
          io.to(participantSocketId).emit("call:incoming", {
            roomId,
            callerId: userId,
            isGroup: room.isGroup,
          });
          socket.emit("call:participant:invited", { participantId });
        } else {
          socket.emit("call:error", { error: "User is not online" });
        }
      },
    );

    /**
     * Set speaker (for group calls)
     */
    socket.on(
      "call:speaker:set",
      (data: { roomId: string; speakerId: string }) => {
        const { roomId, speakerId } = data;
        console.log("[Socket] call:speaker:set", { roomId, speakerId });

        const room = callRooms.get(roomId);
        if (!room) return;

        // Only creator can change speaker
        if (room.createdBy !== userId) {
          socket.emit("call:error", {
            error: "Only call creator can change speaker",
          });
          return;
        }

        room.speakerId = speakerId;
        io.to(roomId).emit("call:speaker:changed", { speakerId });
      },
    );

    /**
     * Toggle mute
     */
    socket.on(
      "call:mute:toggle",
      (data: { roomId: string; isMuted: boolean }) => {
        const { roomId, isMuted } = data;
        const room = callRooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (participant) {
          participant.isMuted = isMuted;
          socket.to(roomId).emit("call:participant:updated", {
            oderId: userId,
            isMuted,
          });
        }
      },
    );

    /**
     * Toggle video
     */
    socket.on(
      "call:video:toggle",
      (data: { roomId: string; isVideoOff: boolean }) => {
        const { roomId, isVideoOff } = data;
        const room = callRooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (participant) {
          participant.isVideoOff = isVideoOff;
          socket.to(roomId).emit("call:participant:updated", {
            oderId: userId,
            isVideoOff,
          });
        }
      },
    );

    // ==================== DISCONNECT ====================

    socket.on("disconnect", () => {
      console.log("[Socket] User disconnected:", userId);
      userSockets.delete(userId);

      // Leave all rooms
      callRooms.forEach((room, roomId) => {
        if (room.participants.has(userId)) {
          handleLeaveRoom(socket, roomId, userId, io);
        }
      });
    });
  });

  console.log("[Socket] Socket.IO server initialized");
  return io;
}

function handleLeaveRoom(
  socket: Socket,
  roomId: string,
  userId: string,
  io: SocketIOServer,
) {
  const room = callRooms.get(roomId);
  if (!room) return;

  room.participants.delete(userId);
  socket.leave(roomId);

  console.log(
    "[Socket] User left room:",
    roomId,
    "Remaining:",
    room.participants.size,
  );

  // Notify others
  socket.to(roomId).emit("call:participant:left", { oderId: userId });

  // If room is empty, delete it
  if (room.participants.size === 0) {
    callRooms.delete(roomId);
    console.log("[Socket] Room deleted (empty):", roomId);
  } else if (room.speakerId === userId) {
    // If speaker left, assign new speaker
    const newSpeaker = room.participants.keys().next().value;
    if (newSpeaker) {
      room.speakerId = newSpeaker;
      io.to(roomId).emit("call:speaker:changed", { speakerId: newSpeaker });
    }
  }
}

// Export room info for API endpoints
export function getRoomInfo(roomId: string): CallRoom | undefined {
  return callRooms.get(roomId);
}

export function getActiveRooms(): string[] {
  return Array.from(callRooms.keys());
}
