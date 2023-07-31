const mongoose = require("mongoose");

module.exports = mongoose.model(
    "gen-access",
    new mongoose.Schema({
        guild_id: String,
        user_id: String,
        access_end_time: String,
        service: String,
    })
);