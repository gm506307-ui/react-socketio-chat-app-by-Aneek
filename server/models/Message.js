const mongoose = require("mongoose");

const MessageSchema =
  new mongoose.Schema({
    id: Number,
    room: String,
    username: String,
    message: String,
    time: String,
    timestamp: String,
    status: String,
    edited: Boolean,
  });
module.exports =
  mongoose.model(
    "Message",
    MessageSchema
  );