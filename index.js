const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;
const uri = `mongodb+srv://task4:${process.env.db_pass}@cluster0.pwp19.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const conn = await client.connect();
    const userCollection = conn
      .db("itransition-task4")
      .collection("userCollection");
    console.log("mongodb connected");

    // register user
    app.post("/api/users/register", async (req, res) => {
      const { email, name, password } = req.body;

      try {
        const existingUser = await userCollection.findOne({ email });

        if (existingUser) {
          return res
            .status(400)
            .json({ error: "User already exists in the database." });
        }

        const newUser = {
          email,
          name,
          password,
          registrationTime: new Date().toISOString(),
          status: "active",
          lastLogin: null,
        };

        await userCollection.insertOne(newUser);

        res.status(201).json({
          message: "User registered successfully.",
          user: newUser,
        });
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Error registering user." });
      }
    });
    // login
    app.post("/api/users/login", async (req, res, next) => {
      try {
        const { email, password } = req.body;
        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).send("User not found");
        }
        if (user?.status === "blocked") {
          return res.status(403).send("User is blocked. Contact support.");
        }
        if (user.password !== password) {
          return res.status(401).send("Invalid credentials.");
        }
        await userCollection.updateOne(
          { email },
          { $set: { lastLogin: new Date() } }
        );

        res.status(200).json({ message: "Login successful." });
      } catch (error) {
        console.log(error.message);
        next(error);
      }
    });
    // fetch users
    app.get("/api/users", async (req, res) => {
      try {
        const getAllUsers = await userCollection.find().toArray();
        res.status(200).send(getAllUsers);
      } catch (error) {
        console.log(error.message);
        throw new error();
      }
    });

    // Delete user
    app.delete("/api/users/:id", async (req, res) => {
      const userId = req.params.id;
      try {
        await userCollection.deleteOne({ _id: new ObjectId(userId) });
        res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Error deleting user" });
      }
    });
    // Block user
    app.patch("/api/users/block/:id", async (req, res) => {
      const userId = req.params.id;
      try {
        await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { status: "blocked" } }
        );
        res.status(200).json({ message: "User blocked successfully" });
      } catch (error) {
        res.status(500).json({ error: "Error blocking user" });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Server started and running successfully sir!");
});

app.listen(port, () => {
  console.log("for terminal server running");
});
