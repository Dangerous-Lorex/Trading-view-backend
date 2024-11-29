const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    uid: String,
    role: String,
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization"
    },
    viewdetail: Number,
    links: [
      {
        user: String,
        date: String,
        url: String
      }
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: Date,
    updatedAt: Date
  })
);

module.exports = User;
