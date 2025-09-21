const express = require('express');
const { check } = require('express-validator');

const itemsController = require('../controllers/items-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

//protecting items routes with token. adding middleware
//any route after this middleware can only be reached with a valid token
router.use(checkAuth);

router.get('/user/:uid', itemsController.getItemsListByUserId);

router.post('/',
    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 3, max: 150 })
    ],
    itemsController.createItem
);

router.patch('/:iid', 
    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 3, max: 150 })
    ],
    itemsController.updateItem
);

router.delete('/:iid', itemsController.deleteItem);

module.exports = router;