const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

//SIGNUP
const signup = async (req, res, next) => {

    //express-validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid input passed.', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        // manual validation if email is used for registration already
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(
            new HttpError('Signing up failed.', 500)
        );
    };

    if (existingUser) {
        return next(
            new HttpError('User exists already.', 422)
        );
    };

    //hashing the password
    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(
            new HttpError('Hashing password failed', 500)
        );
    }

    //creating a new user
    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        items: []
    });

    //saving the new user to database
    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Signing up failed', 500);
        return next(error);
    };

    //creating token after creating user, and storing id and email in it
    let token;
    try{
        token = jwt.sign(
            { userId: createdUser.id, email: createdUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    }catch(err){
         return next(new HttpError('Signing up failed', 500));
    }

    // res.status(201).json({ user: createdUser.toObject({ getters: true }) });
    res.status(201).json({ userId:createdUser.id, name:createdUser.name, email:createdUser.email, token:token });
};

//LOGIN
const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        // manual validation if email is im database
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(
            new HttpError('Loggin in failed.', 500)
        );
    };

    if (!existingUser) {
        return next(
            new HttpError('Invalid credentials.', 403)
        );
    };

    //hashed password
    let isValidPassword = false;
    //bcrypt.compare will retern boolean true/false
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        return next(
            new HttpError('Logging in failed.', 403)
        );
    };

    //checking if entered password is correct
    if (!isValidPassword) {
        return next(
            new HttpError('Invalid credentials.', 403)
        );
    }

    //token
    let token;
    try{
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            'supersecret_dont_share',
            { expiresIn: '1h' }
        );
    }catch(err){
         return next(new HttpError('Logging up failed', 500));
    }

    // res.json({ message: 'Logged in!', userId: existingUser.id, name: existingUser.name });
    res.json({ userId: existingUser.id, name: existingUser.name, email: existingUser.email, token: token });
};

exports.signup = signup;
exports.login = login;