const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Organization = db.organizations;
require('dotenv').config()

exports.getUserList = async (req, res) => {
    try {
        // Updated to use await instead of exec with a callback
        const users = await User.find({}).populate("organization");
        let _list = [];
        for (var i = 0; i < users.length; i++) {
            _list.push({
                id: users[i]._id,
                username: users[i].username,
                email: users[i].email,
                role: users[i].role,
                organization: users[i].organization !== null && users[i].organization !== undefined ? users[i].organization.title : null,
                createdAt: users[i].createdAt,
                updatedAt: users[i].updatedAt
            });
        }
        _list.shift()
        res.status(200).send(_list);
    } catch (err) {
        res.status(500).send({ message: err.message, status: 500 });
    }
}