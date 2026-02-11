const User = require("../models/userModel");

const initializeUsers = async () => {
    try {
        const usersToCreate = [
            {
                name: "Admin User",
                email: "admin123@gmail.com",
                password: "admin123", // ← Plain text - pre-save hook will hash
                phone: "0100000000",
                role: "Admin" // ← Capital A
            },
            {
                name: "Cashier User",
                email: "cashier123@gmail.com",
                password: "cashier123", // ← Plain text - pre-save hook will hash
                phone: "0200000000",
                role: "Cashier" // ← Capital C
            }
        ];

        for (const userData of usersToCreate) {
            const existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                // ✅ Create new user (password will be hashed by pre-save hook)
                const newUser = new User(userData);
                await newUser.save();
                console.log(`✅ User initialized: ${userData.role} (${userData.email})`);
            } else {
                // ✅ Update role if different
                if (existingUser.role !== userData.role) {
                    existingUser.role = userData.role;
                    await existingUser.save();
                    console.log(`🔄 User role updated: ${userData.role} (${userData.email})`);
                } else {
                    console.log(`ℹ️  User already exists: ${userData.role} (${userData.email})`);
                }
            }
        }

    } catch (error) {
        console.error("❌ Error initializing users:", error);
    }
};

module.exports = initializeUsers;