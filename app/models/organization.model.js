const mongoose = require("mongoose");

const Organization = mongoose.model(
  "Organization",
  new mongoose.Schema({
    title: String
  })
);

module.exports = Organization;
