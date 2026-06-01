const User = require('../models/User');
const { handleDBError } = require('../utils/helpers');
const mongoose = require('mongoose');

exports.searchUsers = async (req, res) => {
  try {
    const { query, excludeId } = req.query;
    console.log('Search query:', query, 'excludeId:', excludeId);
    const filter = query && query.trim() !== ''
      ? {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } },
          ],
        }
      : {};

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      filter._id = { $ne: excludeId };
      console.log('Excluding ID:', excludeId);
    } else if (excludeId) {
      console.log('Invalid excludeId:', excludeId);
    }

    const users = await User.find(filter)
      .limit(query ? 10 : 5)
      .select('name username profileImage followRequests acceptedFollowRequests followers');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    handleDBError(res, error);
  }
};