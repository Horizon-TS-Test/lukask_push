var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var subscribeRouter = require('./routes/subscribe');
var notificationRouter = require('./routes/notification');

var app = express(
  console.log("Se incio el servidor de notificaciones")
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//////////////////FIREBASE CONNECTION:////////////////////////
var admin = require('firebase-admin'); //FOR FIREBASE DATABASE ACCESS

var serviceAccount = require("./config/lukask-realtime-db-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://lukask-ba9b4.firebaseio.com"
});

app.use(function(req, res, next) {
  req.admin = admin;
  next();
});
//////////////////////////////////////////////////////////////

//////////////////////////////////////// ENABLE CORS: ////////////////////////////////////////////
//TO ENSURE OUR FRONT END CLIENT COULD REACH THIS MIDDLEWARE SERVER:
app.use(function (req, res, next) {
  //res.setHeader('Access-Control-Allow-Origin', servers.allow_origin);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Length, X-Requested-With, Content-Type, Accept, X-Access-Token');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS, PATCH');

  //PREFLIGHT REQUEST HACKED:
  //REF: https://vinaygopinath.me/blog/tech/enable-cors-with-pre-flight/
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////

app.use('/subscribe', subscribeRouter);
app.use('/notification', notificationRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
