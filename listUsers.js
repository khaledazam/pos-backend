const mongoose = require("mongoose");
const User = require("./models/userModel");
const config = require("./config/config");

const checkUsers = async () => {
    try {
        await mongoose.connect(config.databaseURI);
        const users = await User.find({}, 'name email role');
        console.table(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
