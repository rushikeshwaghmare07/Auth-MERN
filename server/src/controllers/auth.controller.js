import { userModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if ((!name, !email, !password)) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "User with email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_TOKEN_EXPIRY }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // sending welcome email
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to MERN-Auth",
      text: `Welcome to Authentication website. Your account has been created with email id: ${email}`,
    };

    await transporter.sendMail(mailOption);

    return res.status(201).json({
      success: true,
      data: user,
      message: "User register successfully.",
    });
  } catch (error) {
    console.error("Error in register controller:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong in while registering the user.",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  try {
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_TOKEN_EXPIRY,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully.",
    });
  } catch (error) {
    console.error("Error in loginUser controller:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in the user.",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User logout successfully.",
    });
  } catch (error) {
    console.log("Error in logoutUser controller:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong in while logout the user.",
    });
  }
};

// send verification OTP to the user's email
const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already verified",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this OTP.`,
    };

    await transporter.sendMail(mailOption);

    return res.status(200).json({
      success: true,
      message: "Verification OTP sent on email",
    });
  } catch (error) {
    console.log("Error in sendVerifyOtp controller:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong in while logout the user.",
    });
  }
};

// verify user with otp
const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      message: "User ID and OTP are required.",
    });
  }

  try {
    const user = await userModel
      .findById(userId)
      .select("+verifyOtp +verifyOtpExpireAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if OTP has expired
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(410).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email has been successfully verified.",
    });
  } catch (error) {
    console.log("Error in verifyEmail controller:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

// check if user is authenticated
const isAuthenticated = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "User is authenticated successfully.",
    });
  } catch (error) {
    console.log("Error in isAuthenticated controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify user authentication. Please try again later.",
    });
  }
};

// Send password reset OTP
const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required to reset your password.",
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with the provided email address.",
      });
    }

    // Generate otp
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Update user's reset OTP and expiration
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP for resetting your password is: ${otp}. This OTP is valid for 15 minutes. If you did not request this, please ignore this email.`,
    };

    // Send the email
    await transporter.sendMail(mailOption);

    return res.status(200).json({
      success: true,
      message: "OTP has been sent to your registered email address.",
    });
  } catch (error) {
    console.log("Error in isAuthenticated controller:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP at the moment. Please try again later.",
    });
  }
};

// Reset user password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message:
        "Email, OTP and new password are required to reset your password.",
    });
  }

  try {
    const user = await userModel
      .findOne({ email })
      .select("+resetOtp +resetOtpExpireAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with the provided email address.",
      });
    }

    // Validate OTP
    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP. Please check the OTP and try again.",
      });
    }

    // Check if OTP has expired
    if (user.resetOtpExpireAt < Date.now()) {
      return res.status(410).json({
        success: false,
        message:
          "The OTP has expired. Please request a new one to reset your password.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear OTP-related fields
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Your password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.log("Error in resetPassword controller:", error);
    return res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred while resetting your password. Please try again later.",
    });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  sendVerifyOtp,
  verifyEmail,
  isAuthenticated,
  sendResetOtp,
  resetPassword,
};
