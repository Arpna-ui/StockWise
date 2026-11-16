import crypto from 'crypto';
import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * @desc    Register a new user with ₹1,00,000 virtual trading money
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    // 1. Validate required inputs
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (Full name, username, email, and password).',
      });
    }

    // 2. Validate passwords match
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.',
      });
    }

    // 3. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // 4. Duplicate checks
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose another username.',
      });
    }

    // 5. Create new user with ₹1,00,000 virtual balance
    const user = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      virtualInitialCapital: 100000.00,
      availableBalance: 100000.00,
      portfolioValue: 100000.00,
      investedBalance: 0.00,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! ₹1,00,000 virtual trading cash credited to your account.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        virtualInitialCapital: user.virtualInitialCapital,
        availableBalance: user.availableBalance,
        portfolioValue: user.portfolioValue,
        investedBalance: user.investedBalance,
        avatar: user.avatar,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Register Controller Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during user registration.',
    });
  }
};

/**
 * @desc    Authenticate user & get JWT token (supports email or username)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const loginId = req.body.loginId || req.body.emailOrUsername || req.body.email || req.body.username;
    const { password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email or username, and password.',
      });
    }

    const cleanLoginId = loginId.trim().toLowerCase();

    // Query user by email OR username
    const user = await User.findOne({
      $or: [{ email: cleanLoginId }, { username: cleanLoginId }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found with provided email or username.',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back to StockWise.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        virtualInitialCapital: user.virtualInitialCapital,
        availableBalance: user.availableBalance,
        portfolioValue: user.portfolioValue,
        investedBalance: user.investedBalance,
        avatar: user.avatar,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Login Controller Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login authentication.',
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        virtualInitialCapital: user.virtualInitialCapital,
        availableBalance: user.availableBalance,
        portfolioValue: user.portfolioValue,
        investedBalance: user.investedBalance,
        avatar: user.avatar,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(`[GetMe Controller Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user session.',
    });
  }
};

/**
 * @desc    Forgot password: generate reset token & send email or console log
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the email address associated with your account.',
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No StockWise account is registered with this email address.',
      });
    }

    // Generate unhashed reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set expiry in 10 minutes
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const emailSubject = 'StockWise Password Reset Request';
    const emailText = `You recently requested to reset your StockWise account password. Visit this link within 10 minutes to set a new password: ${resetUrl}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563EB;">StockWise — Learn. Trade. Grow.</h2>
        <p>Hello <b>${user.fullName}</b>,</p>
        <p>You requested a password reset for your StockWise virtual trading account.</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Your Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 0.85rem;">This link is valid for 10 minutes. If you did not request this, please disregard this email.</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: user.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      resetUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated! Check your email (or terminal console if SMTP is pending).',
      deliveryMode: emailResult.mode,
      resetUrl: emailResult.mode === 'console_logged' ? resetUrl : undefined,
    });
  } catch (error) {
    console.error(`[ForgotPassword Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Could not send password reset email.',
    });
  }
};

/**
 * @desc    Reset password using reset token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Hash the token from URL to match database record
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired (valid for 10 minutes).',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const authToken = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully! You are now logged in.',
      token: authToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        virtualInitialCapital: user.virtualInitialCapital,
        availableBalance: user.availableBalance,
        portfolioValue: user.portfolioValue,
        avatar: user.avatar,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    console.error(`[ResetPassword Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
};
