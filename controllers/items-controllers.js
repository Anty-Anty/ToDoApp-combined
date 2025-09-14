const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Item = require('../models/item');
const User = require('../models/user');

//FIND LIST OF ITEMS
const getItemsListByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    let itemsList;

    //searching for items
    try {
        itemsList = await Item.find({ creator: userId });
    } catch (err) {
        const error = new HttpError(
            'Fetching items failed', 500
        );
        return next(error);
    };

    // if (itemsList.length === 0) {
    //     return next(
    //         new HttpError('Could not find places for this user.', 404)
    //     );
    // };

    res.json({ itemsList: itemsList.map(item => item.toObject({ getters: true })) });
};

//CREATE ITEM
const createItem = async (req, res, next) => {

    //express-validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid input passed.', 422));
    }

    const { title, description } = req.body;

    //getting user id from token
    const creator = req.userData.userId

    const createdItem = new Item({
        title,
        description,
        creator
    });

    //check if user exist in User collection (database)
    let user;
    try {
        user = await User.findById(creator)
    } catch (err) {
        //first error handles cases when database is not awailable, bad connection etc.
        return next(new HttpError('Creating place failed.', 500));
    }

    if (!user) {
        //second error handles saces when databse was reached but user was not found
        return next(new HttpError('Creating place failed. User was not found', 404));
    };

    //session & transaction . saving item to database and saving item id to user document.
    //for transaction collection needs to be created manulally in Atlas account( items collection)
    try {
        // await createdItem.save();
        //start session
        const sess = await mongoose.startSession();
        //start transaction
        sess.startTransaction();
        //saving new item
        await createdItem.save({ session: sess });
        //saving item id in user object
        //this only updates the in-memory User document
        user.items.push(createdItem);
        //saving new user object
        await user.save({ session: sess })
        //finishing transactionm(only now changes saved to database)
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            'Creating item failed', 500
        );
        return next(error);
    };

    res.status(201).json({ item: createdItem.toObject({ getters: true }) });
};

//UPDATE/EDIT ITEM
const updateItem = async (req, res, next) => {

    //express-validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid input passed.', 422));
    }

    const { title, description } = req.body;
    const itemId = req.params.iid;

    //searching item in database

    let updatedItem;
    try {
        updatedItem = await Item.findById(itemId);
    } catch (err) {
        const error = new HttpError(
            'Could not update place (could not find place in database)', 500
        );
        return next(error);
    }

    //making sure that only creator can update items by comparing updated item creator id to 
    //creator id passed with token
    // console.log('Updated Item Creator:', updatedItem.creator);
    // console.log('Token User ID:', req.userData.userId);

    if (updatedItem.creator.toString() !== req.userData.userId) {
        return next(new HttpError('You are not allowed to edit this place.', 401));
    }

    //updating required fields
    updatedItem.title = title;
    updatedItem.description = description;

    //saving place in database

    try {
        await updatedItem.save();
    } catch (err) {
        const error = new HttpError(
            'Could not update place (was not saved to database)', 500
        );
        return next(error);
    }


    res.status(200).json({ item: updatedItem.toObject({ getters: true }) });
};

//DELETE ITEM
const deleteItem = async (req, res, next) => {
    const itemId = req.params.iid;

    let item;

    //finding item in database
    //populate provides access to users collection 
    //now creator field in item document contains object with creator parameters, not just creator id
    try {
        item = await Item.findById(itemId).populate('creator');
    } catch (err) {
        const error = new HttpError(
            'Could not delete item (could not find in database)', 500
        );
        return next(error);
    };

    //check if item id exist in item collection
    if (!item) {
        return next(new HttpError('Could not find item for this id.', 404));
    };

    //making sure that only creator can update items by comparing updated item creator id to 
    //creator id passed with token
    // console.log('Deleted Item Creator:', item.creator.id);
    // console.log('Token User ID:', req.userData.userId);

    if (item.creator.id !== req.userData.userId) {
        return next(new HttpError('You are not allowed to delete this place.', 401));
    }

    //deleting item from database
    try {
        // await item.deleteOne();
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await item.deleteOne({ session: sess });
        //accessing place stored in creator document
        //this only updates the in-memory User document
        item.creator.items.pull(item);
        //saving newly created user to collection
        await item.creator.save({ sessopn: sess });
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError(
            'Could not delete place', 500
        );
        return next(error);
    };

    res.status(200).json({ message: 'Item was deleted.' })
};

exports.getItemsListByUserId = getItemsListByUserId;
exports.createItem = createItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;