const mongoose = require("mongoose");

module.exports = mongoose.model(
    "accounts",
    new mongoose.Schema({
        guild_id: String,
        service: String,
        account_name: String,
        account_password: String,
    })
);