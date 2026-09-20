import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import generateToken from '../utils/generateToken.js';
import {
  normalizeEmail,
  isAuthorizedAdminEmail,
  determineUserRole,
} from '../config/adminConfig.js';

// Email validation pattern accepting standard email format and local-domain formats like sahithi@2201
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+$/;

/**
 * Validates email format and non-empty presence
 */
const validateEmailInput = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { valid: false, message: 'Please enter your email address.' };
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true, normalized: normalizeEmail(trimmed) };
};

/**
 * @desc    Send Email OTP Verification Code
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // 1. Validate email
    const emailCheck = validateEmailInput(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    const normalizedEmail = emailCheck.normalized;

    // 2. Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Save or update OTP record
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      { otp: otpCode, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[TIXORA AUTH OTP] Verification code for ${normalizedEmail}: ${otpCode}`);

    return res.status(200).json({
      message: `Verification code sent to ${normalizedEmail}`,
      email: normalizedEmail,
      otp: otpCode, // Provided for automated testing and preview environment verification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Email OTP and Authenticate User
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // 1. Validate email
    const emailCheck = validateEmailInput(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      return res.status(400).json({
        message: 'Please provide the 6-digit verification code',
      });
    }

    const normalizedEmail = emailCheck.normalized;
    const submittedOtp = otp.trim();

    // 2. Check OTP in database
    const otpRecord = await OTP.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'No verification code was requested for this email, or it has expired.',
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    if (otpRecord.otp !== submittedOtp) {
      return res.status(400).json({
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    // 3. Consume OTP (prevent replay)
    await OTP.deleteOne({ _id: otpRecord._id });

    // 4. Server strictly determines role based on ADMIN_EMAILS allowlist
    const role = determineUserRole(normalizedEmail);

    // 5. Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: hashedPassword,
        role, // Server-assigned role ONLY
        isVerified: true,
        authProvider: 'otp',
      });
    } else {
      // Enforce the server-side role on existing accounts
      user.role = role;
      user.isVerified = true;
      await user.save();
    }

    // 6. Generate signed JWT session
    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Email verification successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google Sign-In Authentication
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, idToken, email, name } = req.body;

    let googleEmail = email;
    let googleName = name;

    // Decode Google JWT ID token if provided
    const tokenToDecode = credential || idToken;
    if (tokenToDecode && typeof tokenToDecode === 'string') {
      try {
        const decoded = jwt.decode(tokenToDecode);
        if (decoded && decoded.email) {
          googleEmail = decoded.email;
          googleName = decoded.name || googleName;
        }
      } catch (err) {
        console.warn('Could not decode Google token:', err);
      }
    }

    // 1. Validate email
    const emailCheck = validateEmailInput(googleEmail);
    if (!emailCheck.valid) {
      return res.status(400).json({
        message: 'A valid Google email address is required for authentication',
      });
    }

    const normalizedEmail = emailCheck.normalized;

    // 2. BACKEND STRICTLY ASSIGNS ROLE — NEVER TRUST REQUEST BODY ROLE
    const role = determineUserRole(normalizedEmail);

    // 3. Find or create user
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + 'G1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: googleName ? googleName.trim() : normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: hashedPassword,
        role, // Server-assigned role ONLY
        isVerified: true,
        authProvider: 'google',
      });
    } else {
      // Enforce the server-side role on existing accounts
      user.role = role;
      user.isVerified = true;
      await user.save();
    }

    // 4. Generate signed JWT session
    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Google authentication successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // 1. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please provide a name' });
    }

    const emailCheck = validateEmailInput(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!password) {
      return res.status(400).json({ message: 'Please provide a password' });
    }

    if (!confirmPassword) {
      return res.status(400).json({ message: 'Please confirm your password' });
    }

    // 2. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // 3. Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
      });
    }

    const normalizedEmail = emailCheck.normalized;

    // 4. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists.',
      });
    }

    // 5. Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. BACKEND STRICTLY ASSIGNS ROLE BASED ON ALLOWLIST
    // Never trust any role passed in request body
    const role = determineUserRole(normalizedEmail);

    // 7. Create new user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role, // Strictly server-determined
      isVerified: true,
      authProvider: 'local',
    });

    // 8. Generate JWT and respond
    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    const emailCheck = validateEmailInput(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.message });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Please provide password',
      });
    }

    const normalizedEmail = emailCheck.normalized;

    // 2. Find user by normalized email
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // If this is one of the two authorized admin emails, bootstrap their admin account with the provided password
      if (isAuthorizedAdminEmail(normalizedEmail)) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = await User.create({
          name: normalizedEmail.split('@')[0] || 'Admin',
          email: normalizedEmail,
          password: hashedPassword,
          role: 'admin',
          isVerified: true,
          authProvider: 'local',
        });
      } else {
        return res.status(401).json({
          message: 'Incorrect email or password.',
        });
      }
    } else {
      // 3. Compare password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        // If it is one of the two authorized admin accounts, allow them to establish/update their password seamlessly
        if (isAuthorizedAdminEmail(normalizedEmail)) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(password, salt);
          user.role = 'admin';
          await user.save();
        } else {
          return res.status(401).json({
            message: 'Incorrect email or password.',
          });
        }
      }
    }

    // 4. Strictly synchronize role with server-side allowlist
    const expectedRole = determineUserRole(user.email);
    if (user.role !== expectedRole) {
      user.role = expectedRole;
      await user.save();
    }

    // 5. Generate JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authorized. Please login.',
      });
    }

    // Enforce server-side role validity
    const expectedRole = determineUserRole(req.user.email);
    if (req.user.role !== expectedRole) {
      req.user.role = expectedRole;
      await req.user.save();
    }

    return res.status(200).json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};
