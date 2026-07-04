const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      match: [
        /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/,
        'Password must be minimum eight characters, at least one letter and one number.',
      ],
    },
    profileImage: { type: String, default: '/default-avatar.png' },
    bio: { type: String, default: '', trim: true },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    acceptedFollowRequests: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    followRequests: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    postNotifications: [
      {
        post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);