var editor = ace.edit("editor");
//var hostURI = 'http://localhost:8080';
var hostURI = 'http://ec2-35-164-159-60.us-west-2.compute.amazonaws.com:8080';

var codeData = [];
var currentDirIdx = 0;
var currentCodeFileID = null;

editor.getSession().on('change', function(e) {
    if(currentCodeFileID) {
        saveChangesInCodeFile();
    }
});

/*body.onload*/
var getInitialUserCodeData = function() {

    editor.setTheme("ace/theme/tomorrow");
    editor.getSession().setMode("ace/mode/javascript");

    document.getElementById('editor').style.fontSize='18px';

    getDirectoryListJSON()
        .then(function(dirList) {
            for(var i=0; i<dirList.length; i++)
                codeData.push({dir:dirList[i], files:[]});
            return dirList[currentDirIdx];
        })
        .then(getCodeFileListJSON)
        .then(function(codefiles) {
            if(codefiles.length > 0) {
                for(var i=0; i<codeData.length; i++) {
                    var data = codeData[i];
                    if(codefiles[0]._dir == data.dir)
                        data.files = codefiles;
                }
                makeCodeFileList(codeData[currentDirIdx].dir);
            }
        })
        .catch(function(err) {
            console.error(err.message);
        });
}

/*ajax Promises*/
var getDirectoryListJSON = function() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: hostURI+'/ccrunner/getDirectoryListJSON',
            type: 'post',
            success: function(dirList) {
                if(dirList)
                    resolve(dirList);
                else
                    reject(new Error("getting directory list has failed"));
            }
        });
    })

}

var getCodeFileListJSON = function(dir) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: hostURI+'/ccrunner/getCodeFileListJSON',
            type: 'post',
            data: {dirname:dir},
            success: function(codefiles) {
                if(codefiles)
                    resolve(codefiles);
                else
                    reject(new Error("getting codefiles in ["+dir+"] has failed"));
            }
        });
    });
}

var saveChangesInCodeFile = function(callback) {

    var contents = editor.getValue();

    $.ajax({
        url: hostURI+'/ccrunner/saveChangesInCodeFile',
        type: 'post',
        data: {objID: currentCodeFileID, contents:contents},
        success: function(result) {
            codeData[currentDirIdx].files.forEach(function(file) {
                if(file._id == currentCodeFileID) {
                    file.contents = contents;
                }
            });
        }
    });
}

var createNewCodeFile = function() {
    var filename = $('#codefile_name').val();
    var lang = $('#codefile_lang').val();
    var dirname = codeData[currentDirIdx].dir;//$('#codefile_dir').val();

    $.ajax({
        url: hostURI+'/ccrunner/createNewCodeFile',
        type: 'post',
        data: {dirname:dirname, filename:filename, lang:lang},
        success: function(result) {

            if(!result.success) {
                $('#codefile_lang').parent().append('<p>'+result.err+'</p>');
            }
            else {
                currentCodeFileID = result.objID;
                var fileobj = {
                    _dir:dirname,
                    _id:result.objID,
                    _uid:$('#user_email').val(),
                    contents: '',
                    filename: filename,
                    lang: lang
                    };
                codeData[currentDirIdx].files.push(fileobj);

                editor.setValue('');
                $('#codefile_name').val(null);
                $('#codefile_lang').val(null);
                $('#create_codefile_modal').modal('hide');
                $('#codefilelist').append(
                    "<a id='"+result.objID+"' class='list-group-item' href=\"javascript:printCodeContents('"+result.objID+"')\">"
                    +filename+"."+lang+
                    "</a>");
            }
        }
    });

}

/*DOM Promises*/
var makeCodeFileList = function(dir) {
    codeData.forEach(function(data) {
       // console.log(data.dir);
        if(data.dir == dir) {
            for(var i=0; i<data.files.length; i++) {
                var f = data.files[i];
                $('#codefilelist').append(
                    "<a id='"+f._id+"' class='list-group-item', href=\"javascript:printCodeContents('"+f._id+"')\">"
                        +f.filename+"."+f.lang+
                    "</a>");
            }
            $('#codefile_name').parent().append('<input id="codefile_dir" type="hidden" name="dirname" value="'+dir+'"/>');
        }
    });

}

var printCodeContents = function(objID) {
    currentCodeFileID = objID;
    var files = codeData[currentDirIdx].files;
    files.forEach(function(f) {
        if(f._id == objID) {
            var lang = '';
            if(f.lang == 'js')
                lang = 'javascript';
            else if(f.lang == 'py')
                lang = 'python';
            else if(f.lang == 'c')
                lang = 'c_cpp';
            console.log(f.contents);
            editor.setValue(f.contents);
            editor.getSession().setMode("ace/mode/"+lang);
        }
    });
};

/*docker service*/
var runCode = function() {

    var file = new Object();
    file = codeData[currentDirIdx].files.find(findCodeFile);

    console.log(file);

    $.ajax({
        url: hostURI+'/ccrunner/runCode',
        dataType: 'json',
        type: 'post',
        data: file,
        success: function(result) {
            console.log(result);
            if(result.err) {
                var arr = result.stderr.split(':');
                var lineNumarr = arr[1].split('\n');
                var lineNum = 'at line:'+lineNumarr[0];

                var exparr = arr[2].split('at');
                var expText = exparr[0];

                //$('#result_content').html('<p>'+lineNum+'</p><p>&nbsp; &nbsp; &nbsp; &nbsp;'+expText+'</p>');
                $('#result_content').html('<p>'+result.stderr+'</p>');

            }
            else
                $('#result_content').html('<p>'+result.data+'</p>');
        },
        error: function(err) {
            console.log(err);
        }

    });
}

var clearResult = function() {
    $('#result_content').html('');
}

function findCodeFile(file) {
    return file._id === currentCodeFileID;
}