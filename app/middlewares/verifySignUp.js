const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // // Check for duplicate username
    // const userByUsername = await User.findOne({ email: req.body.email });
    // if (userByUsername) {
    //   return res.status(400).send({ message: "Failed! Email is already in use!", status: 400 });
    // }

    // Check for duplicate email
    const userByEmail = await User.findOne({ email: req.body.email });
    if (userByEmail) {
      return res.status(400).send({ message: "Failed! Email is already in use!", status: 400 });
    }

    // If no duplicates, proceed to the next middleware
    next();
  } catch (err) {
    console.error(`Error checking duplicates: ${err.message}`); // Log the error for debugging
    res.status(500).send({ message: "Internal Server Error", status: 500 }); // Return a generic error message
  }
};

checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
          status: 400
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};

module.exports = verifySignUp;
