const createError = require("http-errors");
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const compression = require("compression");
const helmet = require("helmet");

const indexRouter = require("./routes/index");
const dashboardRouter = require("./routes/dashboard");

const app = express();

//Setup Handlebars instance helpers
const hbs = exphbs.create({
  defaultLayout: "main",
  // Specify helpers which are only registered on this instance.
  helpers: {
    isScheduled: function (a) {
      if (a === "Scheduled") {
        return true;
      }
    },
    isStarted: function (m) {
      if (m === "Started") {
        return true;
      }
    },
    isSelected: function (firstId, secondId) {
      if (firstId.toString() == secondId) {
        return " selected";
      } else {
        return "";
      }
    },
  },
  runtimeOptions: {
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true,
  },
});

app.engine("handlebars", hbs.engine); //Handlebars engine with custom helpers
app.set("view engine", "handlebars");

app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

// Static files to serve
app.use(
  "/jquery",
  express.static(path.join(__dirname, "/node_modules/jquery/dist"))
);
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "/node_modules/bootstrap/dist"))
);
app.use(
  "/chart-js",
  express.static(path.join(__dirname, "/node_modules/chart.js/dist"))
);
app.use(
  "/feather-icons",
  express.static(path.join(__dirname, "/node_modules/feather-icons/dist"))
);
app.use(express.static(path.join(__dirname, "/public")));

// Endpoints
app.use("/", indexRouter);
app.use("/dashboard", dashboardRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
