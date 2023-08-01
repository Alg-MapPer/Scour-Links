const mongoose = require('mongoose');

const links_schema = mongoose.Schema({
    title: String,
    link: String,
    code: String,
    author: String,
    visitors: Array,
    history: Array,
    password: String,
    uses: Number,
    maxUses: Number,
    privacy: String,
    time: Date,
    description: String
});

module.exports = mongoose.model('links', links_schema);