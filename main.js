var express = require('express'),
    router = express.Router(),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    slashes = require('connect-slashes'),
    jadeStatic = require('connect-jade-static');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(jadeStatic({
    baseDir: path.join(__dirname, '/views/statics'),
    baseUrl: '/',
    maxAge: 86400,
    jade: {
        pretty: false
    }
}));
app.use(slashes());

router.all(/.*/, function(req, res, next) {
    var host = req.header('host');
    if (host.match(/^www\..*/i) || host.match(/localhost/i)) {
        next();
    } else {
        res.redirect(301, "http://www." + host + req.url);
    }
});

var routes = require('./routes/index');

app.use('/', router);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    if (err.status == 404) {
        res.status(err.status);
        res.render('error', {
            message: err.message,
            error: err
        });
    } else next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;