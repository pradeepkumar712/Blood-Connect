
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
  try {
    await client.connect();

    const db = client.db("bloodconnect");
    
const donorsCollection = db.collection("donors");

    // Find donors by blood group and city
    app.get("/api/donors", async (req, res) => {
      try {
        const { bloodGroup, city } = req.query;

        const filter = {
          availability: "available"
        };

        if (bloodGroup) {
          filter.bloodGroup = bloodGroup;
        }

        if (city && city.trim()) {
          filter.city = {
            $regex: city.trim(),
            $options: "i"
          };
        }

        const donors = await donorsCollection
          .find(filter)
          .project({
            name: 1,
            bloodGroup: 1,
            city: 1,
            availability: 1,
            _id: 0
          })
          .toArray();

        res.json({
          success: true,
          count: donors.length,
          donors
        });
      } catch (error) {
        console.error("Find donors error:", error.message);

        res.status(500).json({
          success: false,
          message: "Unable to search donors right now."
        });
      }
    });


// Register a new donor
app.post("/api/donors", async (req, res) => {
  try {
    const {
      name,
      bloodGroup,
      city,
      phone,
      availability,
      consent
    } = req.body;

    const validBloodGroups = [
      "A+", "A-", "B+", "B-",
      "AB+", "AB-", "O+", "O-"
    ];

    if (
      typeof name !== "string" ||
      typeof city !== "string" ||
      typeof phone !== "string" ||
      !name.trim() ||
      !city.trim() ||
      !/^[0-9]{10}$/.test(phone) ||
      !validBloodGroups.includes(bloodGroup) ||
      !["available", "unavailable"].includes(availability) ||
      consent !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid details and consent."
      });
    }

    const donor = {
      name: name.trim(),
      bloodGroup,
      city: city.trim(),
      phone,
      availability,
      consent,
      createdAt: new Date()
    };

    const result = await donorsCollection.insertOne(donor);

    res.status(201).json({
      success: true,
      message: "Donor registered successfully!",
      donorId: result.insertedId.toString()
    });

  } catch (error) {
    console.error("Donor registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to register donor right now."
    });
  }
});


    await db.command({ ping: 1 });

    console.log("MongoDB connected successfully!");

    app.get("/", (req, res) => {
      res.send("BloodConnect Backend is running!");
    });

    app.get("/api/health", async (req, res) => {
      try {
        await db.command({ ping: 1 });

        res.json({
          success: true,
          message: "Backend and MongoDB are working"
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          message: "Database unavailable"
        });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
