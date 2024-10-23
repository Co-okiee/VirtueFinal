const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, enum: ['teacher', 'student'], required: true }
});

module.exports = mongoose.model('User', userSchema);
