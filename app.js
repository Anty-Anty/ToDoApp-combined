const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const itemsRoutes = require('./routes/items-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require ('./models/http-error');

const app = express();

app.use(bodyParser.json());

//--FRONTEND SURVED STATICALY. gives access to all stutic files, JS files, etc.
app.use(express.static(path.join('public')));

//CORS error fix
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE')
    next();
});

app.use('/api/items', itemsRoutes);
app.use('/api/users', usersRoutes);

//--FRONTEND SURVED STATICALY. for any unknown route sending back index.html
app.use((req, res, next) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
})

//--NOT FOR COMBINED APP
// app.use((req,res,next)=>{
//     return next(new HttpError('Could not find this route.', 404));
// });

//error handling middleware, this func will execute if any middleware infront gives an error
app.use((error, req, res, next)=>{
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'An unknown error occurred!'});
});

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.z6beont.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
// mongoose.connect(`mongodb+srv://toDoAppAdmin:Loop123XYZ@cluster0.z6beont.mongodb.net/toDoApp?retryWrites=true&w=majority&appName=Cluster0`)

.then(()=>{
    app.listen(5000);
})
.catch(err=>{
    console.log(err);
});
