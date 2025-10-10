//authController.js
import { User } from '../models/PostgreSQL_AllModels.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/errorHandler.js';
import { generateTokenAndSetCookie, clearCookie } from '../utils/jwtUtils.js';
import crypto from "crypto";
import {sendEmail} from "../utils/sendEmail.js";
import { sendSms } from '../utils/sendSMS.js';
import {Otp} from "../models/otpModel.js";
export const signup = async (req, res, next) => {
  try {
    console.log('Signup request received:', req.body);
    const { firstname, lastname, email, password } = req.body;
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });
    const userResponse = user.toJSON();
    delete userResponse.password;
    generateTokenAndSetCookie(user.id, res);
    res.status(201).json({
      success: true,
      message: "User created successfully!",
      user: userResponse
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(errorHandler(409, 'Email already registered.'));
    }
    console.error('Error during signup:', error);
    next(errorHandler(500, 'Internal server error during signup.'));
  }
};
export const signin = async (req, res, next) => {
  try {
    console.log('Signin request received:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return next(errorHandler(400, 'Email and password are required.'));
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(errorHandler(404, 'User not found.'));
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return next(errorHandler(401, 'Invalid email or password.'));
    }
    const userResponse = user.toJSON();
    delete userResponse.password;
    generateTokenAndSetCookie(user.id, res);
    res.status(200).json({
      success: true,
      message: 'User signed in successfully!',
      user: userResponse
    });
  } catch (error) {
    console.error('Error during signin:', error);
    next(errorHandler(500, 'Internal server error during signin.'));
  }
};

export const google = async (req, res, next) => {
  try {
    const { firstname, lastname, email, photo } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      const geratedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcryptjs.hash(geratedPassword, 10);

      const newUser = new User({
        firstname,
        lastname,
        email,
        password: hashedPassword,
        profilePicture: photo,
      });
      await newUser.save();
      // Original (MongoDB-like):
      // const token = generateTokenAndSetCookie(newUser._id, res);
      // const { password: hashedPassword2, ...rest } = newUser._doc;
      // Corrected for PostgreSQL:
      const token = generateTokenAndSetCookie(newUser.id, res);
      const { password: hashedPassword2, ...rest } = newUser.toJSON(); // newUser.toJSON() returns a plain object

      res.status(200).json(rest);
      
    } else {
      // Similarly for existing user:
      // Original:
      // const token = generateTokenAndSetCookie(user._id, res);
      // const { password: hashedPassword , ...rest } = user._doc;
      // Corrected for PostgreSQL:
      const token = generateTokenAndSetCookie(user.id, res);
      const { password: hashedPassword , ...rest } = user.toJSON(); // user.toJSON() returns a plain object

      res.status(200).json(rest);
    }
  }
  catch (error) {
    next(error);
  }
}

export const signout = (req, res,) => {
  clearCookie(res);
}


//----------------------------otp section // forgot password / reset password ------------------------------------------------

export const requestOtp = async (req, res) => {
  const { email} = req.body;

  try {
    // Validate required fields
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    console.log(user);

    const Telnumber=user.phoneNumber;
    console.log(Telnumber);

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Remove old OTP entries
    await Otp.deleteMany({ email });

    // Save OTP to the database
    await Otp.create({ email, otp, expiresAt: otpExpiry });

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`,
    });

    // Send OTP via SMS using Bolt/Twilio (or another service)
    try{
      if (Telnumber=="Not Provided"){
          return res.status(200).json({ success:true, message: "OTP sent to your email"})

      }
      else{
        await sendSms(Telnumber, `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`);
      }
    }
    catch(error){
      return res.status(500).json({ success: true, message: "Failed to send OTP via SMS."});
   
    }
    // Response on success
    res.status(200).json({ success: true, message: "OTP sent to your email and phone number." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if the OTP is valid
    const otpEntry = await Otp.findOne({ email, otp });
    if (!otpEntry) return res.status(400).json({ success: false, message: "Invalid OTP" });

    // OTP is valid; delete it
   // await Otp.deleteMany({ email });

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};

// Reset Password
export const resetPasswordOtp = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    // Verify OTP
    const otpEntry = await Otp.findOne({ email, otp });
    if (!otpEntry) return res.status(400).json({ success: false, message: "Invalid OTP" });

    const now = new Date();
    if (now > otpEntry.expiresAt) {
      await Otp.deleteMany({ email }); // Clear expired OTPs
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    // Find user and update password (bypass validation)
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = hashedPassword;

    // Save the user without validating firstname and lastname
    await user.save({ validateBeforeSave: false });

    await Otp.deleteMany({ email }); // Clear OTPs after reset
    res.status(200).json({ success: true, message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};
