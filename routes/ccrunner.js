var express = require('express');
var router = express.Router();
var session = require('express-session');
var repoService = require('../service/repoService');
var dockerService = require('../service/dockerService');

/* GET home page. */
router.get('/', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    if(_userInfo) {
        res.render('CCRunner/main', {userInfo: _userInfo});
    }
    else {
        res.redirect('/');
    }
    //res.render('CCRunner/main');
});

router.post('/runCode', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _file = req.body;
    if(_userInfo) {
        dockerService.runCode(_file)
            .then(function(result) {
                //console.log(result);
                res.json(result);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json({success:false, err:err});
            });
    }
    else
        res.json(null);
});

router.post('/getDirectoryListJSON', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    if(_userInfo) {
        repoService.getDirectoryListJSON(_userInfo.email)
            .then(function(list) {
                console.log(list);
                res.json(list);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/getCodeFileListJSON', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _dir = req.body.dirname;
    if(_userInfo) {
        repoService.getCodeFileListJSON(_userInfo.email, _dir)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/createNewDirectory', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _newdir = req.body.newdirname;
    if(_userInfo) {
        repoService.createNewDirectory(_userInfo.email, _newdir)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/createNewCodeFile', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _dir = req.body.dirname;
    var _lang = req.body.lang;
    var _filename = req.body.filename;
    if(_userInfo) {
        repoService.createNewCodeFile(_userInfo.email, _dir, _lang, _filename)
            .then(function(insertedID) {
                res.json({success:true, objID: insertedID});
            })
            .catch(function(err) {
                console.error(err.message);
                res.json({success:false, err:err.message});
            });
    }
    else
        res.json(null);
});

router.post('/changeDirectoryName', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _dir = req.body.dirname;
    var _newdir = req.body.newdirname;
    if(_userInfo) {
        repoService.changeDirectoryName(_userInfo.email, _dir, _newdir)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/changeCodeFileName', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _objID = req.body.objID;
    var _newfilename = req.body.newfilename;
    if(_userInfo) {
        repoService.changeCodeFileName(_objID, _newfilename)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/changeCodeFileLanguage', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _objID = req.body.objID;
    var _lang = req.body.lang;
    if(_userInfo) {
        repoService.changeCodeFileLanguage(_objID, _lang)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/saveChangesInCodeFile', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _objID = req.body.objID;
    var _contents = req.body.contents;
    if(_userInfo) {
        repoService.saveChangesInCodeFile(_objID, _contents)
            .then(function(result) {
                res.json(result);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/deleteDirectory', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _dir = req.body.dirname;
    if(_userInfo) {
        repoService.deleteDirectory(_userInfo.email, _dir)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/deleteCodeFile', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _objID = req.body.objID;
    if(_userInfo) {
        repoService.deleteCodeFile(_objID)
            .then(function(codeFileList) {
                res.json(codeFileList);
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

router.post('/getCodeFileContents', function(req, res, next) {
    var _userInfo = req.session.userInfo;
    var _objID = req.body.objID;
    if(_userInfo) {
        repoService.getCodeFileContents(_objID)
            .then(function(codeContents) {
                res.json({contents:codeContents});
            })
            .catch(function(err) {
                console.error(err.message);
                res.json(null);
            });
    }
    else
        res.json(null);
});

module.exports = router;
