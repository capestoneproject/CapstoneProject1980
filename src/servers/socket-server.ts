import { Server, Socket } from "socket.io";
import { createServer } from "http";

interface ServerToClientEvents {
  "user-connected": () => void;
  "user-disconnected": () => void;
  offer: (data: { offer: RTCSessionDescriptionInit }) => void;
  answer: (data: { answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  "join-room": (data: { roomId: string; isAdmin: boolean }) => void;
  offer: (data: { roomId: string; offer: RTCSessionDescriptionInit }) => void;
  answer: (data: { roomId: string; answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (data: {
    roomId: string;
    candidate: RTCIceCandidateInit;
  }) => void;
}

interface RoomData {
  admin?: string;
  user?: string;
  hasOffer?: boolean;
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track users in rooms
const rooms = new Map<string, RoomData>();

io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", ({ roomId, isAdmin }) => {
      try {
        console.log(`${isAdmin ? "Admin" : "User"} joining room ${roomId}`);

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
          rooms.set(roomId, { hasOffer: false });
        }

        const room = rooms.get(roomId)!;

        // Check if role is already taken
        if (isAdmin && room.admin) {
          socket.emit("error", {
            message: "Admin already exists in this room",
          });
          return;
        }
        if (!isAdmin && room.user) {
          socket.emit("error", { message: "User already exists in this room" });
          return;
        }

        // Store user based on role
        if (isAdmin) {
          room.admin = socket.id;
        } else {
          room.user = socket.id;
        }

        socket.join(roomId);

        // If both users are present, notify them
        if (room.admin && room.user) {
          io.to(roomId).emit("user-connected");
        }
      } catch (error) {
        console.error("Error in join-room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("offer", ({ roomId, offer }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.hasOffer) {
          socket.emit("error", { message: "Offer already exists" });
          return;
        }

        room.hasOffer = true;
        if (room?.user) {
          io.to(room.user).emit("offer", { offer });
        }
      } catch (error) {
        console.error("Error in offer:", error);
        socket.emit("error", { message: "Failed to send offer" });
      }
    });

    socket.on("answer", ({ roomId, answer }) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (!room.hasOffer) {
          socket.emit("error", { message: "No offer exists" });
          return;
        }

        if (room?.admin) {
          io.to(room.admin).emit("answer", { answer });
          room.hasOffer = false; // Reset offer state after answer is sent
        }
      } catch (error) {
        console.error("Error in answer:", error);
        socket.emit("error", { message: "Failed to send answer" });
      }
    });

    socket.on("ice-candidate", ({ roomId, candidate }) => {
      try {
        socket.to(roomId).emit("ice-candidate", { candidate });
      } catch (error) {
        console.error("Error in ice-candidate:", error);
        socket.emit("error", { message: "Failed to send ICE candidate" });
      }
    });

    socket.on("disconnecting", () => {
      try {
        // Remove user from rooms
        for (const [roomId, room] of rooms.entries()) {
          if (room.admin === socket.id) {
            room.admin = undefined;
            room.hasOffer = false;
            io.to(roomId).emit("user-disconnected");
          }
          if (room.user === socket.id) {
            room.user = undefined;
            room.hasOffer = false;
            io.to(roomId).emit("user-disconnected");
          }
          // Remove room if empty
          if (!room.admin && !room.user) {
            rooms.delete(roomId);
          }
        }
      } catch (error) {
        console.error("Error in disconnecting:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  }
);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
