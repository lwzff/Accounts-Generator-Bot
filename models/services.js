const mongoose = require("mongoose");

module.exports = mongoose.model(
    "services",
    new mongoose.Schema({
        guild_id: String,
        service: String,
        role: String,
    })
);