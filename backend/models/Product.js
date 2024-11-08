    const mongoose = require('mongoose');

    const ProductSchema = new mongoose.Schema({
        _id: String,
        title: String,
        description: String,
        price: Number,
        dateOfSale: Date,
        category: String,
        __v: Boolean
    });

    module.exports = mongoose.model('Product', ProductSchema);
