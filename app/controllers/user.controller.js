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

exports.updateUser = async (req, res) => {
    try {
        const { id, organization } = req.body;
        
        // Find the organization first
        let organizationId = null;
        if (organization) {
            const org = await Organization.findOne({ title: organization });
            if (!org) {
                const newOrg = new Organization({
                  title: organization
                });
                await newOrg.save(); // Use await for saving the new organization
                organizationId = newOrg._id;
            } else {
                organizationId = org._id;
            }
        }

        const user = await User.findByIdAndUpdate(id,
            {
                username: req.body.username,
                email: req.body.email,
                role: req.body.isAdmin ? "admin" : "user",
                organization: organizationId
            },
            { new: true }).populate("organization");
            
        res.send({ status: 200, message: "Update User Successfully", user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            organization: user.organization !== null && user.organization !== undefined ? user.organization.title : null
        } });
    } catch (error) {
        res.status(500).send({ status: 500, message: error.message });
    }
}
