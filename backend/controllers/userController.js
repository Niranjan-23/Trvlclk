const User = require('../models/User');
const { handleDBError } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'bio', 'profileImage'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.sendFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (requesterId.toString() === req.params.targetId.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.targetId)) {
      return res.status(400).json({ error: 'Invalid target ID' });
    }
    const targetUser = await User.findById(req.params.targetId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    if (targetUser.followers.map(id => id.toString()).includes(requesterId.toString())) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }
    if (targetUser.followRequests.map(id => id.toString()).includes(requesterId.toString())) {
      return res.status(400).json({ error: 'Follow request already sent' });
    }
    targetUser.followRequests.push(requesterId);
    await targetUser.save();
    res.status(200).json({ message: 'Follow request sent', user: targetUser });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.getFollowRequests = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id)
      .populate('followRequests acceptedFollowRequests', 'name username profileImage');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({
      pendingFollowRequests: user.followRequests,
      acceptedFollowRequests: user.acceptedFollowRequests,
    });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.followRequests = user.followRequests.filter(
      id => id.toString() !== requesterId.toString()
    );
    if (!user.acceptedFollowRequests.map(id => id.toString()).includes(requesterId.toString())) {
      user.acceptedFollowRequests.push(requesterId);
    }
    if (!user.followers.map(id => id.toString()).includes(requesterId.toString())) {
      user.followers.push(requesterId);
    }
    await user.save();

    const requester = await User.findById(requesterId);
    if (requester && !requester.following.map(id => id.toString()).includes(req.params.id.toString())) {
      requester.following.push(req.params.id);
      await requester.save();
    }

    const updatedUser = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({
      message: 'Follow request accepted. Please click "Follow Back" to complete the process.',
      user: updatedUser,
    });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.rejectFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.followRequests = user.followRequests.filter(
      id => id.toString() !== requesterId.toString()
    );
    await user.save();

    const updatedUser = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({ message: 'Follow request rejected', user: updatedUser });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.followBack = async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ error: 'Invalid requester ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.acceptedFollowRequests = user.acceptedFollowRequests.filter(
      id => id.toString() !== requesterId.toString()
    );
    if (!user.following.map(id => id.toString()).includes(requesterId.toString())) {
      user.following.push(requesterId);
    }
    await user.save();

    const requester = await User.findById(requesterId);
    if (requester && !requester.followers.map(id => id.toString()).includes(req.params.id.toString())) {
      requester.followers.push(req.params.id);
      await requester.save();
    }

    const updatedUser = await User.findById(req.params.id)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({ message: 'Followed back successfully', user: updatedUser });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.unfollow = async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId || !mongoose.Types.ObjectId.isValid(followerId)) {
      return res.status(400).json({ error: 'Invalid follower ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.targetId)) {
      return res.status(400).json({ error: 'Invalid target ID' });
    }
    if (followerId.toString() === req.params.targetId.toString()) {
      return res.status(400).json({ error: 'You cannot unfollow yourself.' });
    }
    const targetUser = await User.findById(req.params.targetId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== followerId.toString()
    );
    await targetUser.save();

    const followerUser = await User.findById(followerId);
    if (!followerUser) return res.status(404).json({ error: 'Follower user not found' });
    followerUser.following = followerUser.following.filter(
      id => id.toString() !== req.params.targetId.toString()
    );
    await followerUser.save();

    const updatedFollowerUser = await User.findById(followerId)
      .populate('followers following', 'username name profileImage')
      .select('-password');
    res.status(200).json({ message: 'Unfollowed successfully', user: updatedFollowerUser });
  } catch (error) {
    handleDBError(res, error);
  }
};