const express = require('express');
const router = express.Router();
const {
  getUser,
  updateUser,
  sendFollowRequest,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  followBack,
  unfollow,
} = require('../controllers/userController');

router.get('/user/:id', getUser);
router.put('/user/:id', updateUser);
router.post('/user/:targetId/followRequest', sendFollowRequest);
router.get('/user/:id/followRequests', getFollowRequests);
router.post('/user/:id/followRequest/accept', acceptFollowRequest);
router.post('/user/:id/followRequest/reject', rejectFollowRequest);
router.post('/user/:id/followBack', followBack);
router.post('/user/:targetId/unfollow', unfollow);

module.exports = router;