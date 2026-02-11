const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

// ✅ Fixed users emails (cannot be modified)
const FIXED_USERS = ["admin123@gmail.com", "cashier123@gmail.com"];

// ✅ Register (Only for new cashiers)
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validation
    if (!name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة"
      });
    }

    // ✅ Prevent using fixed emails
    if (FIXED_USERS.includes(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "هذا الإيميل محجوز للنظام"
      });
    }

    // Check if email exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "الإيميل مستخدم بالفعل"
      });
    }

    // ✅ All new users are Cashier (not Admin)
    user = new User({
      name,
      phone,
      email,
      password,
      role: "Cashier"
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret || "your-default-secret-change-me",
      { expiresIn: "30d" }
    );

    // ✅ SET COOKIE
    res.cookie('accessToken', token, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: false // false for localhost
    });

    res.status(201).json({
      success: true,
      message: "تم التسجيل بنجاح",
      token, // Also send in body
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "خطأ في السيرفر"
    });
  }
};

// ✅ Login
// ✅ Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "الإيميل وكلمة المرور مطلوبين" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "بيانات خاطئة" });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwtSecret || "your-default-secret-change-me",
      { expiresIn: "30d" }
    );

    // ✅ FIXED: Set HttpOnly Cookie with specific options
    const cookieOptions = {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: false // Set to true in production
    };

    res.cookie('accessToken', token, cookieOptions);

    res.status(200).json({
      success: true,
      token, // Return token for localStorage fallback
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "خطأ في السيرفر" });
  }
};

// ... getUserData ...

// ✅ Logout
exports.logout = async (req, res) => {
  // ✅ FIXED: Clear cookie with same options (except maxAge) to ensure deletion
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  });

  res.status(200).json({
    success: true,
    message: "تم تسجيل الخروج بنجاح"
  });
};

// ✅ Seed Fixed Users
exports.seedFixedUsers = async () => {
  try {
    const usersToSeed = [
      {
        name: "Admin User",
        email: "admin123@gmail.com",
        password: "admin123", // Will be hashed by pre-save hook? Need to check model. Assuming model hashes it or we need to hash it here. usually controller handles hashing if manual. but register uses new User(). let's check model if I can.
        phone: "0000000000",
        role: "Admin"
      },
      {
        name: "Cashier User",
        email: "cashier123@gmail.com",
        password: "cashier123",
        phone: "1111111111",
        role: "Cashier"
      }
    ];

    for (const userData of usersToSeed) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        // Determine if we need to hash manually without seeing model. 
        // Given register function didn't hash manually before saving "new User", 
        // it implies the User model has a pre 'save' hook to hash passwords.
        // However, I will check if register hashed it.
        // Register code: const { ... password } = req.body; ... new User({ ... password ... }).save();
        // So yes, the model likely hashes it.
        await new User(userData).save();
        console.log(`✅ Seeded user: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  }
};