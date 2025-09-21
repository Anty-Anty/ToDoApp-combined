const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();



router.post('/signup',
    [
        check('name')
            .not()
            .isEmpty(),
        check('email')
            .normalizeEmail()
            .isEmail(),
        check('password')
            .isLength({ min: 6 })
    ]
    , usersController.signup);

router.post('/login', usersController.login);

router.use(checkAuth);
router.get('/:uid/userInfo', usersController.userInfo);
router.patch('/:uid/color', usersController.updateUserColor);

module.exports = router;