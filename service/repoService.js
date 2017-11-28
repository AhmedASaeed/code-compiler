/**
 * Created by yewon on 12/7/16.
 */
var repoService = {};

var MongoClient = require('mongodb').MongoClient;
    //, assert = require('assert');

var ObjectID = require('mongodb').ObjectID;

var uri = 'mongodb://ec2-52-79-41-171.ap-northeast-2.compute.amazonaws.com:27017/cc-project';
//var uri = 'mongodb://localhost:27017/cc-project';

var mongoConnectionErr = new Error("MongoDB connection db obj is null");

repoService.getDirectoryListJSON = function(email) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        Promise.all([_db, _email])
            .then(getDirectoryListDocument)
            .then(function(directoryListDoc) {
                if(directoryListDoc) {
                    var directories = [];
                    console.log(directoryListDoc);
                    directoryListDoc.directories.forEach(function(item) {
                        directories.push(item.name);
                    });
                    resolve(directories);
                }
                else
                    reject(new Error("no directory exists for ["+_email+"]"));
            });
    });
}

repoService.getCodeFileListJSON = function(email, dirname) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _dirname = dirname;
        Promise.all([_db, _email, _dirname])
            .then(getCodeFileDocuments)
            .then(function(codeFileList) {
                if(codeFileList)
                    resolve(codeFileList);
                else
                    reject(new Error("there is no code file in ["+_dirname+"] directory"));
            });
    });
}

repoService.createNewDirectory = function(email, dirname) {
   return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _newdir = dirname;

        Promise.all([_db, _email, _newdir])
            .then(doesDirectoryExist)
            .then(function(resultDoc) {
                if(resultDoc)
                    reject(new Error("directory ["+_newdir+"] already exists"));
                else
                    return Promise.all([_db, _email, _newdir]);
            })
            .then(insertNewDirectoryElem)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.nModified == 1 && queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("inserting new directory ["+_newdir+"] failed"));
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.createNewCodeFile = function(email, dirname, lang, filename) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _dirname = dirname;
        var _lang = lang;
        var _filename = filename;

        Promise.all([_db, _email, _dirname])
            .then(doesDirectoryExist)
            .then(function(dirListDoc) {
                if (!dirListDoc)
                    reject(new Error("directory ["+_dirname+"] does not exist"));
                else
                    return Promise.all([_db, _email, _dirname, _lang, _filename]);
            })
            .then(doesCodeFileExist)
            .then(function(codeFileDoc) {
                if (codeFileDoc)
                    reject(new Error("code file ["+_filename+"."+_lang+"] already exists"));
                else
                    return Promise.all([_db, _email, _dirname, _lang, _filename]);
            })
            .then(insertNewCodeFile)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.ok == 1)
                    resolve(queryResult.insertedId);
                else
                    reject(new Error("inserting new code file ["+_filename+"."+_lang+"] failed"));
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.changeDirectoryName = function(email, dirname, newdirname) {
   return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _dirname = dirname;
        var _newdirname = newdirname;

        Promise.all([_db, _email, _dirname])
            .then(doesDirectoryExist)
            .then(function(resultDoc) {
                if(!resultDoc)
                    reject(new Error("directory ["+_newdir+"] does not exist"));
                else
                    return Promise.all([_db, resultDoc._id, _dirname, _newdirname]);
            })
            .then(updateDirectoryElem)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.nModified == 1 && queryResult.result.ok == 1)
                    return Promise.all([_db, _email, _dirname, _newdirname]);
                else
                    reject(new Error("changing directory name from ["+_dirname+"] to ["+_newdirname+"] failed"));
            })
            .then(updateDirectoryOfAllCodeFiles)
            .then(function(queryResult) {
                if(queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("changing dirname of codefiles from ["+_dirname+"] to ["+_newdirname+"] failed"));
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.changeCodeFileName = function(objID, newfilename) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _objID = objID;
        var _newfilename = newfilename;

        Promise.all([_db, _objID, _newfilename])
            .then(updateCodeFileName)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.nModified == 1 && queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("changing file name to ["+_newfilename+"] failed"))
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.changeCodeFileLanguage = function(objID, lang) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _objID = objID;
        var _lang = lang;

        Promise.all([_db, _objID, _lang])
            .then(updateCodeFileLang)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.nModified == 1 && queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("changing file lang to ["+_lang+"] failed"))
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.saveChangesInCodeFile = function(objID, contents) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _objID = objID;
        var _contents = contents;

        Promise.all([_db, _objID, _contents])
            .then(updateCodeFileContents)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.nModified == 1 && queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("saving file changes failed:\n"+_contents));
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.deleteDirectory = function(email, dirname) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _email = email;
        var _dirname = dirname;

        Promise.all([_db, _email, _dirname])
            .then(doesDirectoryExist)
            .then(function(resultDoc) {
                if(!resultDoc)
                    reject(new Error("directory ["+_newdir+"] does not exist"));
                else
                    return Promise.all([_db, _email, _dirname]);
            })
            .then(deleteDirectoryElem)
            .then(function(queryResult) {
                if(queryResult.result.n == 1 && queryResult.result.nModified == 1 && queryResult.result.ok == 1)
                    return Promise.all([_db, _email, _dirname]);
                else
                    reject(new Error("deleting ["+_dirname+"] directory has failed"));
            })
            .then(deleteAllCodeFilesWithDirectory)
            .then(function(queryResult) {
                console.log(queryResult);
                if(queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("deleting codefiles of ["+_dirname+"] directory has failed"));
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.deleteCodeFile = function(objID) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _objID = objID;

        Promise.all([_db, _objID])
            .then(deleteCodeFile)
            .then(function(queryResult) {
                console.log(queryResult);
                if(queryResult.result.n == 1 && queryResult.result.ok == 1)
                    resolve(true);
                else
                    reject(new Error("deleting code file has failed"))
            })
            .catch(function(err) {
                reject(err);
            });
    });
}

repoService.getCodeFileContents = function(objID) {
    return new Promise(function(resolve, reject) {
        var _db = MongoClient.connect(uri);
        var _objID = objID;

        Promise.all([_db, _objID])
            .then(findCodeFile)
            .then(function(codeFileDoc) {
                if(codeFileDoc)
                    resolve(codeFileDoc.contents);
                else
                    reject(new Error("finding file object whose id:"+_objID));
            })
            .catch(function(err) {
                reject(err);
            });

    });
}

var findCodeFile = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _objID = params[1];

        if(_db)
            resolve(_db.collection('codefiles').findOne({_id: new ObjectID(_objID)}));
        else
            reject(mongoConnectionErr);
    });
}

var deleteCodeFile = function(params) {
    return new Promise(function(resovle, reject) {
        var _db = params[0];
        var _objID = params[1];

        if(_db)
            resovle(_db.collection('codefiles').deleteOne({_id: new ObjectID(_objID)}));
        else
            reject(mongoConnectionErr);
    });
}

var deleteAllCodeFilesWithDirectory = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dirname = params[2];

        if(_db)
            resolve(_db.collection('codefiles').deleteMany({_uid:_email, _dir:_dirname}));
        else
            reject(mongoConnectionErr);
    });
}

var deleteDirectoryElem = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dir = params[2];

        if(_db)
            resolve(_db.collection('directorylist').updateOne({_uid:_email}, {$pull: {directories:{name:_dir}}}));
        else
            reject(mongoConnectionErr);
    });
}

var updateCodeFileContents = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _objID = params[1];
        var _contents = params[2];

        if(_db)
            resolve(_db.collection('codefiles').updateOne({_id:new ObjectID(_objID)}, {$set: {contents:_contents}}));
        else
            reject(mongoConnectionErr);
    });
}

var updateCodeFileLang = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _objID = params[1];
        var _lang = params[2];

        if(_db)
            resolve(_db.collection('codefiles').updateOne({_id:new ObjectID(_objID)}, {$set: {lang:_lang}}));
        else
            reject(mongoConnectionErr);
    });
}

var updateCodeFileName = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _objID = params[1];
        var _newfilename = params[2];

        if(_db)
            resolve(_db.collection('codefiles').updateOne({_id:new ObjectID(_objID)}, {$set: {filename:_newfilename}}));
        else
            reject(mongoConnectionErr);
    });
}

var updateDirectoryOfAllCodeFiles = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dirname = params[2];
        var _newdirname = params[3];

        if(_db)
            resolve(_db.collection('codefiles').updateMany({_uid:_email, _dir:_dirname}, {$set:{_dir:_newdirname}}));
        else
            reject(mongoConnectionErr);
    });
}

var updateDirectoryElem = function(params) {
    return new Promise(function(resolve,reject) {
        var _db = params[0];
        var _objID = params[1];
        var _dir = params[2];
        var _newdir = params[3];

        if(_db)
            resolve(_db.collection('directorylist').updateOne({_id:new ObjectID(_objID), "directories.name":_dir}, {$set:{"directories.$.name":_newdir}}));
        else
            reject(mongoConnectionErr);
    });
}

var insertNewCodeFile = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dirname = params[2];
        var _lang = params[3];
        var _filename = params[4];

        if(_db)
            resolve(_db.collection('codefiles').insertOne({_uid:_email, _dir:_dirname, lang:_lang, filename:_filename, contents:""}));
        else
            reject(mongoConnectionErr);
    });
}

var doesCodeFileExist = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dirname = params[2];
        var _lang = params[3];
        var _filename = params[4];

        if(_db)
            resolve(_db.collection('codefiles').findOne({_uid:_email, _dir:_dirname, lang:_lang, filename:_filename}));
        else
            reject(mongoConnectionErr);
    });
}

var insertNewDirectoryElem = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _newdir = params[2];

        if(_db)
            resolve(_db.collection('directorylist').updateOne({_uid:_email}, {$addToSet: {directories:{name:_newdir}}}));
        else
            reject(mongoConnectionErr);
    });
}

var doesDirectoryExist = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dirname = params[2];

        if(_db)
            resolve(_db.collection('directorylist').findOne({_uid:_email, directories: { $elemMatch: {name:_dirname}}}));
        else
            reject(mongoConnectionErr);
    });
}

var getCodeFileDocuments = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];
        var _dirname = params[2];

        if(_db)
            resolve(_db.collection('codefiles').find({_uid:_email, _dir:_dirname}).toArray());
        else
            reject(mongoConnectionErr);
    });
}

var getDirectoryListDocument = function(params) {
    return new Promise(function(resolve, reject) {
        var _db = params[0];
        var _email = params[1];

        if(_db)
            resolve(_db.collection('directorylist').findOne({_uid:_email}));
        else
            reject(mongoConnectionErr);
    });
}

module.exports = repoService;