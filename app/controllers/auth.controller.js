const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Organization = db.organizations;
require('dotenv').config()
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

async function generateUniqueId() {
  let id;
  let isUnique = false;
  while (!isUnique) {
    id = Math.floor(19933991 + Math.random() * 91191);
    const existingUser = await User.findOne({ uid: id }).exec();
    if (!existingUser) {
      isUnique = true;
    }
  }
  return `TRADING${id}`;
}

exports.signup = async (req, res) => {
  try {
    const uniqueId = await generateUniqueId();

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      uid: uniqueId,
      role: req.body.isAdmin ? 'admin' : 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      confirmRegisterStatus: false
    });
    const org = await Organization.findOne({ title: req.body.organization });
    if (!org) {
      const newOrg = new Organization({
        title: req.body.organization
      });
      await newOrg.save(); // Use await for saving the new organization
      user.organization = newOrg._id;
    } else {
      user.organization = org._id;
    }

    await user.save(); // Use await for saving the user
    const mailOptions = {
      to: user.email,
      from: 'noreply@tbtrading.com',
      subject: 'TBTrading Account Register',
      text: 'TBTrading Account Register',
      html: `
        <html>
        <body style="background-color: #eafbfB; font-family: sans-serif; padding: 0; margin: 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #eafbfB;">
                <tr>
                    <td align="center" bgcolor="#eafbfB" style="padding: 40px 0 30px 0;">
                        <h1 style="color: rgba(32, 101, 209, 0.9); margin: 0;">Trading</h1>
                        <h4 style="color: rgba(32, 101, 209, 0.9); margin: 0;">Welcome to Trading!</h4>
                    </td>
                </tr>
                <tr>
                    <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                        <p style="font-size: 16px;">Hi ${user.username},</p>
                        <p style="font-size: 16px;">Welcome to TBTrading! Your UID is <strong>${uniqueId}</strong>.</p>
                        <a href="https://t78.ch/apps/tb-trading-bot/#/confirm-register?uid=${uniqueId}" 
                          style="background-color: rgba(32, 101, 209, 0.9); color: white; width: 312px; height: 48px; border-radius: 8px; font-size: 16px; text-decoration: none; display: inline-block; line-height: 48px; text-align: center;">
                          <strong>Confirm</strong>
                        </a>
                        <p style="font-size: 16px;">Please note this uniqueID for using TBTrading better</p>
                        <p style="font-size: 16px;">If you did not request this, please ignore this email or contact our support team if you have any questions.</p>                              
                        <p style="font-size: 16px;">Thank you.</p>                        
                    </td>
                </tr>
                <tr style="height:40px"></tr>
            </table>
        </body>
        </html>
        `
    };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "adev@gmaxfunding.com",
        pass: "fase qvem gdtq nnyn"
      }
    });
    // const transporter = nodemailer.createTransport({
    //   host: "server58.hostfactory.ch",
    //   port: 465,
    //   secure: true,
    //   auth: {
    //     user: "Trading@tb-software.ch",
    //     pass: "ArU9yBY9EZY6"
    //   }
    // });
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.send({ message: "User was registered successfully!", status: 200 });

  } catch (err) {
    res.status(500).send({ message: err.message, status: 500 });
  }
};

exports.getallorgs = async (req, res) => {
  try {
    const docs = await Organization.find(); // Use await instead of callback
    res.status(200).send(docs);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate("organization").exec()
    if (!user) {
      return res.status(404).send({ message: "User Not found.", status: 404 });
    }

    if (user.password) {
      var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    } else {
      res.status(401).send({
        accessToken: null,
        message: "Please use Google Signin!"
      });
      return;
    }

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    var token = jwt.sign({ id: user._id }, config.secret, { // Added token generation
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token,
      organization: user.organization !== null && user.organization !== undefined ? user.organization.title : null,
      vd: (user.role === 'user' && user.viewdetail === 0 ? 0 : 1),
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


exports.googleSignin = async (req, res) => {
  const { token } = req.body;

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (payload) {

      const user = await User.findOne({ email: payload.email })

      if (!user) {
        const uniqueId = await generateUniqueId();
        const saveData = new User({
          username: payload.name,
          email: payload.email,
          role: 'user',
          uid: uniqueId,
          createdAt: new Date(),
          updatedAt: new Date(),
          confirmRegisterStatus: false
        })
        await saveData.save();

        const resUser = await User.findOne({ email: payload.email })

        var resToken = jwt.sign({ id: resUser._id }, config.secret, { // Added token generation
          expiresIn: 86400 // 24 hours
        });

        return res.status(200).send({
          id: resUser._id,
          username: resUser.username,
          email: resUser.email,
          role: resUser.role,
          accessToken: resToken,
          vd: (resUser.role === 'user' && resUser.viewdetail === 0 ? 0 : 1),
        });
      }

      var resToken = jwt.sign({ id: user._id }, config.secret, { // Added token generation
        expiresIn: 86400 // 24 hours
      });

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        accessToken: resToken,
        vd: (user.role === 'user' && user.viewdetail === 0 ? 0 : 1),
      });

    } else {
      res.status(400).json({ error: 'Invalid token payload' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

exports.googleSignup = async (req, res) => {
  const { token } = req.body;

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (payload) {

      const user = await User.findOne({ email: payload.email })

      if (!user) {

      }

      res.status(200).send({
        status: 200,
        message: "User already exists!"
      });

    } else {
      res.status(400).json({ error: 'Invalid token payload' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send('User not found');
  }

  // Generate a reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

  await user.save();

  const resetUrl = `https://t78.ch/apps/tb-trading-bot/#/reset-password?token=${resetToken}`;
  // const resetUrl = `http://localhost:3000/#/reset-password?token=${resetToken}`;
  // Send email
  const mailOptions = {
    to: user.email,
    from: 'noreply@tbtrading.com',
    subject: 'Password Reset',
    text: 'Password Reset',
    html: `
        <html>
        <body style="background-color: #eafbfB; font-family: sans-serif; padding: 0; margin: 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #eafbfB;">
                <tr>
                    <td align="center" bgcolor="#eafbfB" style="padding: 40px 0 30px 0;">
                        <h1 style="color: rgba(32, 101, 209, 0.9); margin: 0;">TB Trading</h1>
                        <h4 style="color: rgba(32, 101, 209, 0.9); margin: 0;">Reset Password</h4>
                    </td>
                </tr>
                <tr>
                    <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                        <p style="font-size: 16px;">Hi ${user.username},</p>
                        <p style="font-size: 16px;">We received your request to reset your TBTrading account password. Please click the button below to reset it.</p>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                            <tr>
                                <td align="center">
                                    <a href="${resetUrl}" style="background-color: rgba(32, 101, 209, 0.9); color: white; width: 312px; height: 48px; border-radius: 8px; font-size: 16px; text-decoration: none; display: inline-block; line-height: 48px; text-align: center;">
                                        <strong>Change Your Password</strong>
                                    </a>
                                </td>
                            </tr>
                        </table>
                        <p style="font-size: 16px;">If you did not request this password reset, please ignore this email or contact our support team if you have any questions.</p>
                        <p style="font-size: 16px;">If you experience any issues with the button above, copy and paste the URL below into your web browser.</p>
                        <p style="font-size: 16px; word-break: break-all;">${resetUrl}</p>
                        <p style="font-size: 16px;">Thank you.</p>                        
                    </td>
                </tr>
                <tr style="height:40px"></tr>
            </table>
        </body>
        </html>
        `
  };
  // const transporter = nodemailer.createTransport({
  //   host: "server58.hostfactory.ch",
  //   port: 465,
  //   secure: true,
  //   auth: {
  //     user: "Trading@tb-software.ch",
  //     pass: "ArU9yBY9EZY6"
  //   }
  // });
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "adev@gmaxfunding.com",
      pass: "fase qvem gdtq nnyn"
    }
  });
  try {
    await transporter.sendMail(mailOptions);
    res.send('An e-mail has been sent to ' + user.email + ' with further instructions.');
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send('Error sending email');
  }
}
exports.resetpassword = async (req, res) => {
  const { token } = req.query;
  const { newPWD } = req.body;
  console.log("token:", token)
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).send('Password reset token is invalid or has expired.');
  }

  user.password = bcrypt.hashSync(newPWD, 8);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  res.send('Your password has been updated.');
}

exports.confirmRegister = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid: uid });
    if (!user) {
      return res.status(404).send('User not found');
    }
    user.confirmRegisterStatus = true;
    await user.save();
    res.send({ status: 200, message: "Confirm Register" });
  } catch (error) {
    res.status(500).send({ status: 500, message: error.message });
  }
}
