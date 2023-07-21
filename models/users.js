const mongoose = require("mongoose");

module.exports = mongoose.model(
    "users",
    new mongoose.Schema({
        guild_id: String,
        user_id: String,
        next_gen: String,
    })
);