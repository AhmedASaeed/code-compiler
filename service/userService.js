var userService = {};

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var bcrypt = require('bcryptjs');

var uri = 'mongodb://ec2-52-79-41-171.ap-northeast-2.compute.amazonaws.com:27017/cc-project';
//var uri = 'mongodb://localhost:27017/cc-project';
var mongoConnectionErr = new Error("MongoDB connection db obj is null");

userService.login = function (email, password) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _password = password;

        Promise.all([_db, _email])
            .then(getUserInfoByEmail)
            .then(function(userInfo) {
                if(userInfo)
                    return Promise.all([_password, userInfo]);
                else
                    reject(new Error("This email is not joined"));
            }, function(err) {
                reject(err);
            })
            .then(doesPasswordMatch)
            .then(function(userInfo) {
                resolve(userInfo);
            }, function(err) {
                reject(err);
            });
    });
}

userService.join = function (email, password) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _password = password;

        Promise.all([_db, _email])
            .then(getUserInfoByEmail)
            .then(function(userInfo) {
                    if(userInfo)
                        reject(new Error("This email is already joined"));
                    else return Promise.all([_db, _email, _password]);
                },
                function(error) {
                    reject(error);
                })
            .then(joinUser)
            .then(function(result) {
                if(result)
                    return Promise.all([_db, _email]);
            })
            .then(initailizeDirectoryList)
            .then(function(result) {
                if(result)
                    resolve(true);
            }, function(err) {
                reject(err);
            });
    });
}

var doesPasswordMatch = function (params) {
    return new Promise(function(resolve, reject) {
        var _password = params[0];
        var _userInfo = params[1];
        var _result = bcrypt.compareSync(_password, _userInfo.hashedPW);

        if(_result)
            resolve(_userInfo);
        else
            reject(new Error("Password does not match"));
    });
}

var joinUser = function (params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _password = params[2];
        var _salt = bcrypt.genSaltSync(10);
        var _hashedPW = bcrypt.hashSync(_password, _salt);

        if(_salt && _hashedPW)
            resolve(_db.collection('userinfo').insertOne(
                            {email:_email, hashedPW:_hashedPW, salt: _salt})
            );
        else
            reject(new Error("Generating salt and Hashing PW failed"));
    });
}

var initailizeDirectoryList = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        if(_db)
            resolve(_db.collection('directorylist').insertOne({_uid:_email, directories: [{name:'test1'}]}));
        else
            reject(mongoConnectionErr);
    });
}

var getUserInfoByEmail = function (params) {
    var _db = params[0];
    var _email = params[1];

    return new Promise(function(resolve, reject) {
        if (_db)
            resolve(_db.collection('userinfo').findOne({email:_email}));
        else
            reject(mongoConnectionErr);
    });
}

module.exports = userService;