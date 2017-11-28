var express = require('express');
var router = express.Router();
var session = require('express-session');
var userService = require('../service/userService');

/* GET home page. */
router.get('/', function(req, res, next) {
    /*var _userInfo = req.session.userInfo;
    if(_userInfo) {
        res.redirect('ccrunner');
    }
    else {
        res.render('index');
    }*/
    res.render('index');
});

router.post('/join', function(req, res, next) {
    var _email = req.body.email;
    var _password = req.body.password;

    userService.join(_email, _password)
        .then(function(result) {
            res.render('joinSuccess');
        })
        .catch(function(err) {
            console.log(err);
            res.render('joinErr', {err: err.message});
        });
});

router.post('/login', function(req, res, next) {
    var _email = req.body.email;
    var _password = req.body.password;

    userService.login(_email, _password)
        .then(function(userInfo) {
            req.session.userInfo = userInfo;
            res.redirect('ccrunner');
        })
        .catch(function(err) {
            console.log(err);
            res.render('loginErr', {err: err.message});
        });
});

router.post('/logout', function(req, res, next) {
    req.session.destroy(function(err) {
        console.error(err);
        res.redirect('/');
    });
});

module.exports = router;
