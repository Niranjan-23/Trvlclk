const express = require("express");
const router = express.Router();
const {
  createPost,
  deletePost,
  getTimelinePosts,
  getUserPosts,
  likePost,
  getPostsByLocation,
} = require("../controllers/postController");
const Post = require("../models/Post");

router.post("/posts", createPost);
router.delete("/posts/:postId", deletePost);
router.get("/timeline", getTimelinePosts);
router.get("/posts/user/:userId", getUserPosts);
router.post("/posts/:postId/like", likePost);
router.get("/posts/:postId", async (req, res) => {
 体育在线

System: try {
    const post = await Post.findById(req.params.postId).populate(
      "user",
      "username profileImage"
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json({ post });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Route for fetching posts by location string
router.get("/posts/location/:location", getPostsByLocation);

// Route for fetching nearby posts
router.get("/nearby", async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng || !radius) {
    return res.status(400).json({ error: "lat, lng, and radius are required" });
  }
  try {
    const posts = await Post.find({
      geo: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000, // meters
        },
      },
    }).populate("user", "username profileImage");
    res.json({ posts });
  } catch (err) {
    console.error("Error in /api/posts/nearby:", err);
    res.status(500).json({ error: "Failed to fetch nearby posts", details: err.message });
  }
});

module.exports = router;