var createError = require('http-errors');
var express = require('express');
var exphbs  = require('express-handlebars');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var compression = require('compression');
var helmet = require('helmet');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var dashboardRouter = require('./routes/dashboard');

var app = express();

//Set up mongoose connection
var mongoose = require('mongoose');
var devDB = 'mongodb://localhost:27017/mfgdashboard';
var mongoDB = process.env.MONGODB_URI || devDB;
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


//Setup Handlebars instance helpers
var hbs = exphbs.create({
  defaultLayout: 'main',
  // Specify helpers which are only registered on this instance.
  helpers: {
    isScheduled: function (a) { 
      if(a==='Scheduled') {
          return true;
      }
    },
    isStarted: function (m) { 
      if(m==='Started') {
          return true;
      }
    },
    isSelected: function (firstId, secondId) {
      // console.log("First ID: " + firstId);
      // console.log("Second ID: " + secondId);
      if(firstId.toString()==secondId) {
        return " selected";
      } else {
        return "";
      }
    }
  }
});

// view engine setup
// app.engine('handlebars', exphbs({defaultLayout: 'main'})); // Default handlebars engine
app.engine('handlebars', hbs.engine); //Handlebars engine with custom helpers
app.set('view engine', 'handlebars');

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dashboard', dashboardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
