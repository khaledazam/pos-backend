// scripts/seedFixedUsers.js
const mongoose = require("mongoose");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const config = require("../config/config");

const seedFixedUsers = async () => {
    try {
        await mongoose.connect(config.mongoUri || "mongodb://localhost:27017/pos-system");
        console.log("✅ Connected to MongoDB");

        const fixedUsers = [
            { name: "Admin", email: "admin123@gmail.com", password: "admin123", phone: "0100000000", role: "Admin" },
            { name: "Cashier", email: "cashier123@gmail.com", password: "cashier123", phone: "0200000000", role: "Cashier" }
        ];

        for (const userData of fixedUsers) {
            let user = await User.findOne({ email: userData.email });
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            if (!user) {
                user = new User({ ...userData, password: hashedPassword });
                await user.save();
                console.log(`✅ User created: ${userData.role} (${userData.email})`);
            } else {
                // Update role or password if needed
                let updated = false;
                if (user.role !== userData.role) {
                    user.role = userData.role;
                    updated = true;
                }
                if (!(await bcrypt.compare(userData.password, user.password))) {
                    user.password = hashedPassword;
                    updated = true;
                }
                if (updated) {
                    await user.save();
                    console.log(`🔄 User updated: ${userData.role} (${userData.email})`);
                } else {
                    console.log(`ℹ️ User already exists: ${userData.role} (${userData.email})`);
                }
            }
        }

        console.log("\n✅ Seed completed!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding users:", error);
        process.exit(1);
    }
};

seedFixedUsers();
