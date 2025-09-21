const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6},
    // array because user has multiple items
    items:  [{ type: mongoose.Types.ObjectId, required: true, ref: 'Item'}],
    createdAt: {type:Date, default:Date.now},
    userTitleColor: { type: String, default: null }
});

//name of MongoDB collection will be Users
module.exports = mongoose.model('User', userSchema);