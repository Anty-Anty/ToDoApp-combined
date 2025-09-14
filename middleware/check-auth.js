const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error');

module.exports = (req,res,next) => {

    //fixing CORS, OPTIONS error
    if (req.method === 'OPTIONS'){
        return next();
    }

    try{
        const token = req.headers.authorization.split(' ')[1]; //Authorization: 'Bearer TOKEN'
        //if token doesnt exist
        if (!token) {
        throw new Error('Authentication failed.')
    }

    //varify is token is valid
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    //adding data to request object
    req.userData = {userId: decodedToken.userId};
    next();
    } catch (err) {
        //if getting token fails (eg split fails):
        return next(new HttpError('Authentication failed.', 403));
    };

    
};