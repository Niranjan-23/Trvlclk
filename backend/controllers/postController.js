// controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const { handleDBError } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.createPost = async (req, res) => {
  try {
    console.log('Received body:', req.body);
    const { userId, imageUrl, location, description, latitude, longitude } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      return res.status(400).json({ error: 'A valid image URL is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === null ||
      longitude === null ||
      isNaN(Number(latitude)) ||
      isNaN(Number(longitude))
    ) {
      return res.status(400).json({ error: 'Latitude and longitude are required and must be numbers.' });
    }
    const lat = Number(latitude);
    const lon = Number(longitude);

    console.log('lat:', latitude, 'lon:', longitude, 'typeof lat:', typeof latitude, typeof longitude);

    const newPost = new Post({
      user: userId,
      imageUrl: imageUrl.trim(),
      likes: [],
      location: location ? location.trim() : '',
      description: description ? description.trim() : '',
      latitude: !isNaN(lat) ? lat : undefined,
      longitude: !isNaN(lon) ? lon : undefined,
    });

    await newPost.save();
    const populatedPost = await Post.findById(newPost._id)
  .populate('user', 'username profileImage')
  .lean(); // ensures it's a plain object so we can manipulate/verify it

if (populatedPost) {
  populatedPost.latitude = newPost.latitude;
  populatedPost.longitude = newPost.longitude;
}

res.status(201).json({ post: populatedPost });

  } catch (error) {
    handleDBError(res, error);
  }
};


exports.deletePost = async (req, res) => {
  try {
    const { userId } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(req.params.postId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.getTimelinePosts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    const posts = await Post.find({ user: { $in: currentUser.following } })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.likePost = async (req, res) => {
  try {
    const { userId } = req.body;
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(req.params.postId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const index = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.status(200).json({ post });
  } catch (error) {
    handleDBError(res, error);
  }
};

// postController.js
exports.getPostsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    if (!location || typeof location !== "string" || location.trim() === "") {
      return res.status(400).json({ error: "A valid location string is required" });
    }

    // Case-insensitive search for posts by location
    const posts = await Post.find({
      location: { $regex: location, $options: "i" }, // Case-insensitive regex match
    })
      .populate("user", "username profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ posts });
  } catch (error) {
    handleDBError(res, error);
  }
};