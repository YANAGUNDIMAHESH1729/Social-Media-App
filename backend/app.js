const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const userModel = require("./models/user");
const postModel = require("./models/post");
const upload = require("./config/multerconfig");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

require('dotenv').config(); 


const mongoURL = process.env.MONGO_URI;

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));



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
    req.user = jwt.verify(token, "shhh");
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}



// Register
app.post("/api/register", async (req, res) => {
  const { email, password, username, name, age } = req.body;

  const exists = await userModel.findOne({ email });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const hash = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    email,
    password: hash,
    username,
    name,
    age,
  });

  const token = jwt.sign({ email, userid: user._id }, "shhh");

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  res.json({ message: "Registered successfully" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email, userid: user._id }, "shhh");

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  res.json({ message: "Login successful" });
});

// Logout
app.get("/api/logout", (req, res) => {
  res.clearCookie("token");
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

  res.json(user);
});

// Upload profile picture
app.post(
  "/api/upload",
  isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email });
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
  const { content } = req.body;

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
  const post = await postModel.findById(req.params.id);

  const index = post.likes.indexOf(req.user.userid);


  if (index === -1) post.likes.push(req.user.userid);
  else post.likes.splice(index, 1);

  await post.save();
  res.json(post);
});

// Update post
app.put("/api/update/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findByIdAndUpdate(
    req.params.id,
    { content: req.body.content },
    { new: true }
  );

  res.json(post);
});

//delete post
app.delete("/api/post/:id", isLoggedIn, async (req, res) => {
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


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on PORT ${PORT}`);
});


