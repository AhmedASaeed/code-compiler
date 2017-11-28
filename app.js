var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

var index = require('./routes/index');
var users = require('./routes/users');
var ccrunner = require('./routes/ccrunner');

var dbURI = 'mongodb://ec2-52-79-41-171.ap-northeast-2.compute.amazonaws.com:27017/cc-project';
//var dbURI = 'mongodb://localhost:27017/cc-project';
var store = new MongoDBStore({
    uri: dbURI,
    collection: 'usersessions'
});

// mongoDB store catch error
store.on('error', function(error) {
    assert.ifError(error);
    assert.ok(false);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// express-session configure
app.use(session({
    secret: 'keyboard cat',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 //1 week
    },
    store: store,
    resave: true,
    saveUninitialized: false
}));

app.use('/', index);
app.use('/users', users);
app.use('/ccrunner', ccrunner);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
