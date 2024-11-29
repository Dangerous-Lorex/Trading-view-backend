const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.organizations = require("./organization.model");

db.ROLES = ["superadmin", "user", "admin", "guest"];

module.exports = db;
