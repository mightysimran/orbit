require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./db");
const path = require("path"); // 🚨 NEW: Required for serving static files

const app = express();

// Create the HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// 🚨 NEW: Serve the 'uploads' folder publicly so the Admin Panel can fetch the images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/driver", require("./routes/driverRoutes"));
app.use("/api/rides", require("./routes/rideRoutes"));

// A "phonebook" to remember which user owns which socket connection
const connectedUsers = new Map();

// Set up the Socket.io connection listener
io.on("connection", (socket) => {
  console.log("⚡ A user connected via WebSocket:", socket.id);

  // 1. User logs into the app (Wakes up the phone line)
  socket.on("join", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`📱 User ${userId} is now online with socket ${socket.id}`);
  });

  // 2. Rider requests a ride
  socket.on("request_ride", (rideData) => {
    console.log(
      `🚨 NEW RIDE: ${rideData.userName} needs a ride to ${rideData.dropoff.name}`,
    );
    // Broadcast this ride to ALL other connected users (drivers)
    socket.broadcast.emit("new_ride_available", rideData);
  });

  // 3. Driver accepts a ride
  socket.on("accept_ride", async (data) => {
    console.log(
      `✅ ACCEPTED: Driver ${data.driverName} is picking up Rider ${data.riderId}`,
    );

    const riderSocketId = connectedUsers.get(data.riderId);

    if (riderSocketId) {
      try {
        // 🚨 ADDED "rating" to the SELECT query!
        const driverInfo = await pool.query(
          `SELECT vehicle_details, plate_number, rating FROM drivers WHERE id = $1 OR user_id = $2`,
          [data.driverId, data.driverId],
        );

        let vehicle = "Vehicle details unavailable";
        let plate = "N/A";
        let currentRating = 5.0;

        if (driverInfo.rows.length > 0) {
          vehicle = driverInfo.rows[0].vehicle_details;
          plate = driverInfo.rows[0].plate_number;
          currentRating = parseFloat(driverInfo.rows[0].rating);
        }

        io.to(riderSocketId).emit("ride_accepted", {
          message: "Your driver is on the way!",
          driverId: data.driverId,
          driverName: data.driverName,
          rideId: data.rideId,
          vehicle_details: vehicle,
          plate_number: plate,
          rating: currentRating, // 🚨 SENDING REAL RATING TO RIDER
        });
      } catch (err) {
        console.error(
          "Error fetching vehicle details for socket:",
          err.message,
        );
      }
    }
  });

  socket.on("ride_started", (data) => {
    console.log(`🚗 Driver picked up Rider: ${data.riderId}`);
    // 🚨 FIX: Look up the socket ID first!
    const riderSocketId = connectedUsers.get(data.riderId);
    if (riderSocketId) {
      io.to(riderSocketId).emit("ride_started");
    }
  });

  socket.on("ride_completed", async (data) => {
    console.log(
      `🏁 Ride completed for Rider: ${data.riderId}. Fare: ₹${data.fare}`,
    );

    // 🚨 NEW: SAVE TO POSTGRES DATABASE
    try {
      // 1. Look up the specific Driver ID from the drivers table using their user_id
      const driverQuery = await pool.query(
        "SELECT id FROM drivers WHERE user_id = $1",
        [data.driverUserId],
      );
      const driverId = driverQuery.rows[0]?.id;

      if (driverId) {
        // 2. Insert the completed ride into the database!
        await pool.query(
          `INSERT INTO rides 
          (rider_id, driver_id, pickup_landmark, dropoff_landmark, status, fare, distance, duration) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            data.riderId,
            driverId,
            data.pickupLandmark,
            data.dropoffLandmark,
            "completed",
            data.fare,
            data.distance,
            data.duration,
          ],
        );
        console.log("💾 SUCCESS: Ride permanently saved to database!");
      } else {
        console.log(
          "⚠️ WARNING: Could not save ride. Driver not found in drivers table.",
        );
      }
    } catch (error) {
      console.error("❌ DB Insert Error:", error);
    }

    // Forward the completion signal to the rider's phone so they see the receipt
    const riderSocketId = connectedUsers.get(data.riderId);
    if (riderSocketId) {
      io.to(riderSocketId).emit("ride_completed", data);
    }
  });

  // 4. User closes the app
  socket.on("disconnect", () => {
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👋 User ${userId} went offline.`);
        break;
      }
    }
    console.log("❌ Connection closed:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
