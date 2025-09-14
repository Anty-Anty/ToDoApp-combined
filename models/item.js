const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const itemSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    creator:  { type: mongoose.Types.ObjectId, required: true, ref: 'User'}
});

//name of MongoDB collection will be Items
module.exports = mongoose.model('Item', itemSchema);