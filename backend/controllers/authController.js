const User = require('../models/User');
const { handleDBError } = require('../utils/helpers');

exports.signup = async (req, res) => {
  try {
    const { email, username, password, name } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required!' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const newUser = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password, // In production, hash the password!
      name: name || username,
    });
    await newUser.save();
    const token = 'dummy-token'; // Replace with real token generation
    res.status(201).json({ user: newUser, token });
  } catch (error) {
    handleDBError(res, error);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = 'dummy-token';
    res.json({ user, token });
  } catch (error) {
    handleDBError(res, error);
  }
};