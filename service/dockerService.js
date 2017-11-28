var dockerService = {};

var fs = require('fs');
var cmd = require('node-cmd');
//var codeDirPath = '/home/yewon/WebstormProjects/cc-project:/cc-project';
var codeDirPath = '/home/ubuntu/WebstormProjects/cc-project:/cc-project';

dockerService.runCode = function(file) {
    return new Promise(function(resolve, reject) {

        createCodeFile(file)
            .then(function(result) {
                if(result) {
                    var filePath = './codeFiles/' + file._id + '.' + file.lang;
                    var cmdStr = getCommandStr(file.lang, filePath);
                    var execResult = executeCodeInDocker(cmdStr);
                    console.log(execResult);
                    return Promise.all([execResult, filePath, cmdStr]);
                }
                else
                    reject(new Error("creating codefile for ["+file.filename+"."+file.lang+"] has failed"));

            })
            .then(function(params) {
                var _execResult = params[0];
                if(_execResult) {
                    //console.log(_execResult);
                    deleteCodeFile(file)
                        .then(function(result) {
                            if(!result)
                                reject(new Error("deleting codefile for ["+file.filename+"."+file.lang+"] has failed"));
                            else
                                resolve(_execResult);
                        });
                }
                else
                    reject(new Error("executing code file in docker has failed."));
            })
    });
}

var createCodeFile = function(file) {
    return new Promise(function(resolve, reject) {
        //fs.writeFileSync('../codeFiles/'+file._id+'.'+file.lang, 'w');
        fs.writeFile('./codeFiles/'+file._id+'.'+file.lang, file.contents,  function(err) {
            if (err) {
                reject(err);
            }
            else
                resolve(true);
        });
    });
}

var deleteCodeFile = function(file) {
    return new Promise(function(resolve, reject) {
        //fs.writeFileSync('../codeFiles/'+file._id+'.'+file.lang, 'w');
        fs.unlink('./codeFiles/'+file._id+'.'+file.lang, function(err) {
            if (err) {
                reject(err);
            }
            else
                resolve(true);
        });
    });
}

var getCommandStr = function(lang, filePath) {
    var cmdStr = null;
    if(lang == 'js') {
        cmdStr = 'sudo docker run --rm -v '
            + codeDirPath + ' -w /cc-project node:latest node '
            + filePath;
           // + './codeFiles/111.js';
        //cmdStr = 'pwd';
    }
    else if(lang == 'py') {
        cmdStr = 'sudo docker run --rm -v '
            + codeDirPath + ' -w /cc-project python:latest python3 '
            + filePath;
    }
    else if(lang == 'c') {
        cmdStr = 'sudo docker run --rm -v '
            + codeDirPath + ' -w /cc-project gcc:latest gcc -o Main '
            + filePath + ' -O2 -std=c99 && ./Main';
    }

    return cmdStr;
}

var executeCodeInDocker = function(command) {
    return new Promise(function(resolve, reject) {
        if(!command)
            reject(new Error("creating command for running docker has failed"));
        cmd.get(command, function(err, data, stderr) {
            /*if(err)
                reject(err);
            else*/
            console.log(stderr);
                resolve({err:err, data:data, stderr:stderr});
        });
    });
}

module.exports = dockerService;