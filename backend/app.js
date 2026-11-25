const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer=require("multer");
const path = require("path");

const userModel = require("./models/user");
const postModel = require("./models/post");
const upload = require("./config/multerconfig");


require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));


// CORS 
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

//Serve uploaded images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);

//Middleware 
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function setAuthCookie(res, token) {
  res.cookie("token", token, cookieOptions);
}



// Register
app.post("/api/register", async (req, res) => {
  const { email, password, username, name, age } = req.body;

  if (![email, password, username, name].every(value => typeof value === "string" && value.trim())) {
    return res.status(400).json({ message: "Name, username, email, and password are required" });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const exists = await userModel.findOne({ email: normalizedEmail });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const hash = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    email: normalizedEmail,
    password: hash,
    username,
    name,
    age,
  });

  const token = jwt.sign({ email: user.email, userid: user._id }, JWT_SECRET);
  setAuthCookie(res, token);

  res.json({ message: "Registered successfully" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await userModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email, userid: user._id }, JWT_SECRET);
  setAuthCookie(res, token);

  res.json({ message: "Login successful" });
});

// Logout
app.get("/api/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ message: "Logged out" });
});



// Get profile (dashboard)
app.get("/api/profile", isLoggedIn, async (req, res) => {
  const user = await userModel
    .findOne({ email: req.user.email })
    .populate({
      path: "posts",
      options: { sort: { createdAt: -1 } }
    });

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// Upload profile picture
app.post(
  "/api/upload",
  isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "Please choose an image" });
    user.profilepic = req.file.filename;
    await user.save();

    res.json({
      message: "Profile picture updated",
      profilepic: user.profilepic,
    });
  }
);



// Create post
app.post("/api/post", isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content) return res.status(400).json({ message: "Post content is required" });
  if (!user) return res.status(404).json({ message: "User not found" });

  const post = await postModel.create({
    user: user._id,
    content,
  });

  user.posts.push(post._id);
  await user.save();

  res.json(post);
});

// Like / Unlike post
app.post("/api/like/:id", isLoggedIn, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid post id" });
  const post = await postModel.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const index = post.likes.findIndex(id => id.toString() === req.user.userid);
  if (index === -1) post.likes.push(req.user.userid);
  else post.likes.splice(index, 1);

  await post.save();
  res.json(post);
});

// Update post
app.put("/api/update/:id", isLoggedIn, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid post id" });
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  if (!content) return res.status(400).json({ message: "Post content is required" });
  const post = await postModel.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.user.toString() !== req.user.userid.toString()) {
    return res.status(403).json({ message: "You can only edit your own posts" });
  }
  post.content = content;
  await post.save();

  res.json(post);
});

//delete post
app.delete("/api/post/:id", isLoggedIn, async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid post id" });
  const post = await postModel.findById(req.params.id);

  if (!post) return res.status(404).json({ message: "Post not found" });

  
  if (post.user.toString() !== req.user.userid.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await post.deleteOne();

  
  await userModel.findByIdAndUpdate(req.user.userid, {
    $pull: { posts: req.params.id }
  });

  res.json({ message: "Post deleted successfully" });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : "Please upload a valid image";
    return res.status(400).json({ message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});


const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log("Backend successfully running");
});

