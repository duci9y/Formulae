var express = require('express'),
    router = express.Router(),
    Recaptcha = require('recaptcha-verify'),
    MathJax = require('../node_modules/MathJax-node/lib/mj-single.js'),
    Sequelize = require('sequelize'),
    Model = require('../model'),
    Memcached = require('memcached');

var Formula = Model.Formula;
var Feedback = Model.Feedback;
var sequelize = Model.sequelize;

RegExp.quote = function(str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

var titlesuffix = ' – Formulae: Quickly lookup mathematical formulas';

var memcached = !!process.env.MEMCACHED_HOST ? new Memcached(process.env.MEMCACHED_HOST) : new Memcached('localhost:11211');

var recaptcha = new Recaptcha({
    secret: process.env.RECAPTCHA_SECRET
});

MathJax.config({
    MathJax: {
        SVG: {
            font: 'STIX-Web'
        }
    }
});
MathJax.start();

router.get('/suggestions', function(req, res, next) {
    res.render('suggestions', {
        title: 'Feedback' + titlesuffix,
        recaptcha_key: process.env.RECAPTCHA_SUGGEST
    });
});
router.post('/suggestions', function(req, res, next) {
    var title = 'Feedback' + titlesuffix;

    function fail(msg) {
        res.render('suggestions', {
            error: new Error(msg),
            title: 'Feedback' + titlesuffix,
            recaptcha_key: process.env.RECAPTCHA_SUGGEST
        });
    }
    if (!req.body.name) {
        fail('Missing name.');
    } else if (!req.body.message) {
        fail('Missing message.');
    } else {
        Feedback.create({
            name: req.body.name,
            email: req.body.email ? req.body.email : null,
            message: req.body.message
        }).then(function(newFeedback) {
            res.render('suggestions', {
                success: true,
                newFeedback: newFeedback,
                title: title,
                recaptcha_key: process.env.RECAPTCHA_SUGGEST
            });
        }).catch(function(err) {
            console.log(err);
            fail('An error occurred. Please try again later.');
        });
    }
});

router.get('/add', function(req, res) {
    res.render('add', {
        title: 'Add A New Formula' + titlesuffix,
        recaptcha_key: process.env.RECAPTCHA_ADD
    });
});

router.post('/add', function(req, res) {
    var title = 'Add A New Formula' + titlesuffix;

    function fail(errormsg) {
        res.render('add', {
            error: new Error(errormsg),
            title: title,
            recaptcha_key: process.env.RECAPTCHA_ADD
        });
    }
    recaptcha.checkResponse(req.body['g-recaptcha-response'], function(error, response) {
        if (error) {
            console.log(error);
            fail('Error validating Captcha. Please try again.');
        } else if (response.success) {
            if (!req.body.title || !req.body.formula) {
                fail('Missing fields.');
                return;
            }
            MathJax.typeset({
                math: req.body.formula,
                format: "AsciiMath",
                svg: true
            }, function(result) {
                if (result.errors) {
                    console.log(result.errors);
                    fail('An error occurred.');
                } else {
                    Formula.create({
                        title: req.body.title,
                        formula: req.body.formula,
                        html: result.svg,
                        comments: req.body.comments ? req.body.comments : null
                    }).then(function(newFormula) {
                        memcached.flush(function() {
                            res.render('add', {
                                success: true,
                                newFormula: newFormula,
                                title: title,
                                recaptcha_key: process.env.RECAPTCHA_ADD
                            });
                        });
                    }).catch(function(err) {
                        console.log(err);
                        fail('An error occurred.');
                    });
                }
            });
        } else {
            fail('Error validating Captcha.');
        }
    });
});

router.get('/query/:query', function(req, res) {
    var query = req.params.query;
    var memcachedKey = 'ns:q:' + encodeURIComponent(query).replace(/%20/g, "+");

    memcached.get(memcachedKey, function(err, data) {
        if (err) console.log('Memcached error: ' + err);
        if (data) res.send(data);
        else {
            var tokens = query.replace(/\band|\bis|\bfor|\bthe|\ba|\ban/gi, '').match(/\b\w+/gi);
            var regex = '';
            for (var i = 0; i < tokens.length; i++) {
                if (i == 0) regex += '\'';
                regex += '[[:<:]]' + tokens[i]; // mysql regex's \w equivalent
                if (i != (tokens.length - 1)) regex += '|';
                else regex += '\'';
            }

            sequelize.query('SELECT id, title, html FROM formulas WHERE (formula RLIKE ' + regex + ' OR title RLIKE ' + regex + ')', {
                model: Formula
            }).then(function(formulas) {
                console.log(query + ': Found ' + formulas.length.toString() + ' results.');
                memcached.set(memcachedKey, formulas, 86400, function(err) {
                    if (err) console.log('Memcached error: ' + err);
                    res.send(formulas);
                });
            }).catch(function(err) {
                console.log('Error querying: ' + err);
            });
        }
    });
});

router.get('/formula/:id', function(req, res, next) {
    memcached.get('ns:f:' + req.params.id, function(err, data) {
        if (err) console.log(err);
        if (data) res.render('formula', {
            formula: data,
            title: data.title + titlesuffix
        })
    })
    Formula.findById(req.params.id).then(function(result) {
        res.render('formula', {
            formula: result,
            title: result.title + titlesuffix
        });
    }).catch(function(err) {
        console.log(err);
        next();
    });
});

router.get('/listall', function(req, res) {
    memcached.getMulti(['ns:l:listall', 'ns:l:size'], function(err, data) {
        console.log(data);
        if (err) console.log(err);
        if (data['ns:l:listall']) res.render('listall', {
            formulas: data['ns:l:listall'],
            title: 'All ' + data['ns:l:size'] + ' Formulas' + titlesuffix
        });
        else sequelize.query('SELECT id, title FROM formulas ORDER BY title', {
            model: Formula
        }).then(function(results) {
            memcached.set('ns:l:listall', results, 86400, function(err) {
                if (err) console.log(err);
                memcached.set('ns:l:size', results.length, 86400, function(err) {
                    if (err) console.log(err);
                    res.render('listall', {
                        formulas: results,
                        title: 'All ' + results.length.toString() + ' Formulas' + titlesuffix
                    });
                });
            });
        });
    });
});

module.exports = router;