// ============================================================
//  BARANGAY RESIDENT AND REQUEST SYSTEM - Backend
//  Based on our Student CRUD demo:
//   1 - Express (routes, HTTP methods, express.json)
//   2 - Mongoose (connect, schema, model)
//  Extra: admin login (session) and a /stats route.
// ============================================================

const path = require("path");

// the .env file sits in the project root, one folder above backend
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// gawan ng server
const app = express();

// middleware - read JSON sent to the request body
app.use(express.json());

// serve the frontend files inside the "frontend" folder
// this lets http://localhost:3000 open our index.html
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ------------------------------------------------------------
// 1 - SCHEMAS and MODELS (same as our Mongoose demo)
// ------------------------------------------------------------
const residentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  birthdate: { type: Date, required: true, max: [Date.now, "Birthdate cannot be in the future"] },
  sex: { type: String, enum: ["Male", "Female"], required: true },
  purok: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  contactNumber: { type: String, trim: true, match: [/^[0-9+\-\s]{7,15}$/, "Invalid contact number"] }
}, { timestamps: true });

const requestSchema = new mongoose.Schema({
  // resident = id ng resident na nag-request
  resident: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
  type: { type: String, required: true, enum: ["Barangay Clearance", "Certificate of Residency", "Certificate of Indigency"] },
  purpose: { type: String, trim: true },
  status: { type: String, enum: ["Pending", "Approved", "Released", "Cancelled"], default: "Pending" }
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }   // hashed, never the real password
});

const Resident = mongoose.model("Resident", residentSchema);
const DocRequest = mongoose.model("Request", requestSchema);
const Admin = mongoose.model("Admin", adminSchema);

// ------------------------------------------------------------
// 2 - SESSION and LOGIN
// ------------------------------------------------------------
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-change-me",
  resave: false,
  saveUninitialized: false
}));

// POST - login
app.post("/login", async (req, res) => {
  try {
    const admin = await Admin.findOne({ username: String(req.body.username || "") });
    // compare the typed password with the hashed one
    const match = admin && await bcrypt.compare(String(req.body.password || ""), admin.passwordHash);

    if (!match) {
      return res.status(401).json({ error: "Wrong username or password" });
    }
    req.session.admin = admin.username;
    res.json({ username: admin.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// every route below needs a logged-in admin
function needLogin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.status(401).json({ error: "Please log in" });
  }
}
app.use(["/residents", "/requests", "/stats"], needLogin);

// ------------------------------------------------------------
// 3 - RESIDENT ROUTES (same idea as our Student routes)
// ------------------------------------------------------------

// GET all residents
app.get("/residents", async (req, res) => {
  try {
    const residents = await Resident.find().sort({ lastName: 1 });
    res.json(residents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one resident by id
app.get("/residents/:id", async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ error: "Resident not found" });
    }
    res.json(resident);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST - add a new resident
app.post("/residents", async (req, res) => {
  try {
    // check muna kung registered na (same name and birthdate)
    const same = await Resident.exists({
      firstName: String(req.body.firstName || "").trim(),
      lastName: String(req.body.lastName || "").trim(),
      birthdate: req.body.birthdate
    }).collation({ locale: "en", strength: 2 });

    if (same) {
      return res.status(400).json({ error: "This resident is already registered" });
    }

    const newResident = new Resident({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      birthdate: req.body.birthdate,
      sex: req.body.sex,
      purok: req.body.purok,
      address: req.body.address,
      contactNumber: req.body.contactNumber
    });
    const saved = await newResident.save();
    res.status(201).json(saved);   // 201 = created
  } catch (err) {
    // this runs when a required field is missing (validation)
    res.status(400).json({ error: err.message });
  }
});

// PUT - update a resident by id
app.put("/residents/:id", async (req, res) => {
  try {
    const updated = await Resident.findByIdAndUpdate(
      req.params.id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        birthdate: req.body.birthdate,
        sex: req.body.sex,
        purok: req.body.purok,
        address: req.body.address,
        contactNumber: req.body.contactNumber
      },
      { new: true, runValidators: true }   // return the updated document, and check the rules again
    );
    if (!updated) {
      return res.status(404).json({ error: "Resident not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - remove a resident by id (and their requests)
app.delete("/residents/:id", async (req, res) => {
  try {
    const deleted = await Resident.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Resident not found" });
    }
    await DocRequest.deleteMany({ resident: req.params.id });
    res.json(deleted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 4 - REQUEST ROUTES
// ------------------------------------------------------------

// GET all requests (populate = palitan ang id ng pangalan ng resident)
app.get("/requests", async (req, res) => {
  try {
    const requests = await DocRequest.find()
      .populate("resident", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET one request by id
app.get("/requests/:id", async (req, res) => {
  try {
    const request = await DocRequest.findById(req.params.id).populate("resident");
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST - add a new request
app.post("/requests", async (req, res) => {
  try {
    const residentExists = await Resident.exists({ _id: req.body.resident });
    if (!residentExists) {
      return res.status(400).json({ error: "Choose a valid resident" });
    }

    const newRequest = new DocRequest({
      resident: req.body.resident,
      type: req.body.type,
      purpose: req.body.purpose
    });
    const saved = await newRequest.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT - update the status of a request
app.put("/requests/:id", async (req, res) => {
  try {
    const updated = await DocRequest.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 5 - DASHBOARD STATS
// ------------------------------------------------------------
app.get("/stats", async (req, res) => {
  try {
    const residents = await Resident.countDocuments();
    const pending = await DocRequest.countDocuments({ status: "Pending" });
    const released = await DocRequest.countDocuments({ status: "Released" });
    res.json({ residents, pending, released });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// 6 - CONNECT to MongoDB, then start the server (port 3000)
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    // first run lang: gawa ng admin kung wala pa
    const hasAdmin = await Admin.exists({});
    if (!hasAdmin) {
      if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
        await Admin.create({
          username: process.env.ADMIN_USERNAME,
          passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
        });
        console.log("Admin account created");
      } else {
        console.log("No admin yet: set ADMIN_USERNAME and ADMIN_PASSWORD in .env, then restart");
      }
    }

    app.listen(PORT, () => {
      console.log("port " + PORT + " is running...");
    });
  })
  .catch((err) => console.log("MongoDB connection failed:", err.message));
