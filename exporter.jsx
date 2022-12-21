/* c. Keith Gilbert, 2021 // I-is-as-I-does, 2022  */

var myErrors = { invalidItem: [], exportFail: [], missingConfig: false };
var myConfig = { ext: 'jpg', res: 'max', dimn: 700, limit: 'adapt', rw: false, html: false, path: './media/', type: 'jpeg' }

Pre();

function myHtmlSnippet(myImgName, myImgClass, myImgAlt, myWidth, myHeight, myCaptionSnippet) {
    return '<div class="media"><figure><picture><source srcset="' + myConfig.path + myImgName + '.webp" type="image/webp"><source srcset="' + myConfig.path + myImgName + '.' + myConfig.ext + '" type="image/' + myConfig.type + '"><img class="' + myImgClass + '" src="' + myConfig.path + myImgName + '.' + myConfig.ext + '" alt="' + myImgAlt + '" width="' + myWidth + '" height="' + myHeight + '"></picture>' + myCaptionSnippet + '</figure></div>'
}


function myCaptionParser(myCaptionParts){
    const myDateRegex = /(^20\d{2}|20\d{2}$)/
        for (var c = 1; c < myCaptionParts.length; c++) {
            if (myCaptionParts[c].match(myDateRegex)) {
                myCaptionParts[0] = '<strong>' + myCaptionParts[0]
                myCaptionParts[c - 1] = myCaptionParts[c - 1] + '</strong>'
                var myLastIndx = myCaptionParts.length - 1
                if (c < myLastIndx) {
                    myCaptionParts[c + 1] = '<em>' + myCaptionParts[c + 1]
                    myCaptionParts[myLastIndx] = myCaptionParts[myLastIndx] + '</em>'
                }
                break
            }
        }
        var myCaptionContent = myCaptionParts.join('<br>')
        return '<figcaption>' + myCaptionContent + '</figcaption>'
}


function Pre() {

    // Check to make sure all required conditions are met
    if (!app.documents.length) {
        alert("No InDesign documents are open. Please open a document and try again.");
        return;
    }
    // Check to make sure the file is saved, otherwise the script can't determine the file path
    if (app.activeDocument.saved == false) {
        alert("The file must be saved before running this script. Please save the file and run the script again.");
        return;
    }

    // Check to make sure the properly-named articles exist
    var myDoc = app.activeDocument;
    resolveMyConfig();
    var myProcess = myProcessResolver(myDoc)

    if (!myProcess.length) {
        alert("No article with an '_export' suffix found. Please check the Articles panel and doc.");
        return;
    }
    var
        _scriptRedraw = app.scriptPreferences.enableRedraw,
        _userInteraction = app.scriptPreferences.userInteractionLevel;
    _measurementUnit = app.scriptPreferences.measurementUnit;
    _zeroPoint = myDoc.zeroPoint;
    _rulerOrigin = myDoc.viewPreferences.rulerOrigin;
    app.scriptPreferences.enableRedraw = false;
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.interactWithAll;
    app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;
    myDoc.zeroPoint = [0, 0];
    myDoc.viewPreferences.rulerOrigin = RulerOrigin.PAGE_ORIGIN;
    Main(myDoc, myProcess);
    app.scriptPreferences.enableRedraw = _scriptRedraw;
    app.scriptPreferences.userInteractionLevel = _userInteraction;
    app.scriptPreferences.measurementUnit = _measurementUnit;
    myDoc.zeroPoint = _zeroPoint;
    myDoc.viewPreferences.rulerOrigin = _rulerOrigin;
    beep();

    var myResponse = myResponseResolver()
    alert(myResponse);
    return;
}

function resolveMyConfig() {

    var myConfigFile = File(myTrimPath($.fileName) + "/exporter_config.txt");
    if (myConfigFile.exists) {
        myConfigFile.open("r");
        var myRawConfig = myConfigFile.read();
        myConfigFile.close();
        myRawConfig = myRawConfig.split(';')
        for (var x = 0; x < myRawConfig.length; x++) {
            var myPar = myRawConfig[x].split("=")
            if (myPar.length === 2) {
                switch (myPar[0]) {
                    case 'ext':
                        if (myPar[1] === 'png') {
                            myConfig.ext = 'png'
                            myConfig.type = 'png'
                        }
                        break;
                    case 'res':
                        if (myPar[1] === 'high') {
                            myConfig.res = 'high'
                        }
                        break;
                    case 'dimn':
                        var myVal = Math.abs(myPar[1])
                        if (!isNaN(myVal) && myVal > 0) {
                            myConfig.dimn = myVal
                        }
                        break;
                    case 'limit':
                        if (myPar[1] === 'width' || myPar[1] === 'height') {
                            myConfig.limit = myPar[1]
                        }
                        break;
                    case 'rw':
                        if (myPar[1] == 'true') {
                            myConfig.rw = true
                        }
                        break;
                    case 'html':
                        if (myPar[1] == 'true') {
                            myConfig.html = true
                        }
                        break;
                    case 'path':
                            myConfig.path = myPar[1]
                        break;
                    default:
                        break;
                }
            }
        }

    } else {
        myErrors.missingConfig = true
    }

}

function myResponseResolver() {
    var myResponse = 'Done. ';
    if (myErrors.missingConfig) {
        myResponse += 'Config file is missing; default config has been used. '
    }
    var myTexts = [
        "could not be processed (empty, hidden or invalid)",
        "could not be exported"
    ];
    var myProps = ['invalidItem', 'exportFail'];
    for (var p = 0; p < myProps.length; p++) {
        var myErrMsgs = myErrors[myProps[p]]
        if (myErrMsgs.length) {
            var myPlural = myErrMsgs.length > 1 ? 's' : '';
            myResponse += myErrMsgs.length + " item" + myPlural + " " + myTexts[p] + ": " + myErrMsgs.join(', ') + ". "
        }
    }
    return myResponse
}


function myProcessResolver(myDoc) {
    var myArticles = myDoc.articles
    var myProcess = []
    if (myArticles.length) {
        var myDocName = myTrimName(myDoc.name)
        for (var i = 0; i < myArticles.length; i++) {
            var myArticleName = myArticles[i].name
            if (myArticleName.indexOf('export') !== -1) {
                var mySp = myArticleName.split('_')
                var myName;
                var myCaptions = false;
                if (mySp.length > 1 && mySp[0] !== 'export') {
                    myName = mySp[0]
                    if (myConfig.html) {
                        myCaptions = myCaptionsResolver(myArticles, myName)
                    }
                } else {
                    myName = myDocName + "-" + (i + 1)
                }
                var myPrc = { articles: myArticles[i], name: myName, captions: myCaptions };
                myProcess.push(myPrc)
            }
        }
    }
    return myProcess
}

function myCaptionsResolver(myArticles, myName) {
    var myCaptions = {};
    var myFoundCaptions = 0;
    var myCaptionArticle = myName + '_captions';
    if (myArticles.itemByName(myCaptionArticle).isValid) {
        var myCaptionsItems = myArticles.itemByName(myCaptionArticle)
        if (myCaptionsItems.articleMembers.length) {
            for (var i = 0; i < myCaptionsItems.articleMembers.length; i++) {
                var myCaptionObject = myCaptionsItems.articleMembers[i].itemRef;
                if (myCaptionObject.constructor.name === "TextFrame" && myCaptionObject.name != "" && myCaptionObject.texts.length && myCaptionObject.texts[0].contents) {
                    var myRefName = myCaptionObject.name.toString().replace('_caption', '')
                    myCaptions[myRefName] = myCaptionObject.texts[0].contents.toString()
                    myFoundCaptions++
                }
            }
        }
    }
    if (myFoundCaptions > 0) {
        return myCaptions
    }
    return false
}

function Main(myDoc, myProcess) {

    for (var i = 0; i < myProcess.length; i++) {
        myExportImg(myProcess[i], myDoc.filePath);
    }

}

function myObjectNameResolver(myObject, myId) {
    var myObjectName = null
    switch (myObject.constructor.name) {
        case "Group":
            if (myObject.name == "") { // The group has not been renamed in the layers panel
                myObjectName = myId + "-group";
            }
            else { // The group has been given a name
                myObjectName = myObject.name;
            }
            break;
        case "TextFrame":
            if (myObject.name == "") { // The text frame has not been renamed in the layers panel
                myObjectName = myId + "-text";
            }
            else { // The text frame has been given a name
                myObjectName = myObject.name;
            }
            break;
        case "Rectangle":
        case "Oval":
        case "Polygon":
        case "GraphicLine":
            if (myObject.name != "") {
                myObjectName = myObject.name;
            }
            else
                if (myObject.graphics[0].isValid) { // In case the frame is empty
                    if (myObject.graphics[0].itemLink) {
                        myObjectName = myObject.graphics[0].itemLink.name;
                    }
                    else {
                        myObjectName = myId + "-pasted-graphic";
                    }
                }


            break;
        default:
            break;
    }

    return myObjectName
}

function myExportImg(myItem, myPathName) {

    var myFolderName = [myItem.name, myConfig.ext, myConfig.limit, String(myConfig.dimn), myConfig.res].join('-')
    var myFolder = new Folder(myPathName + "/" + myFolderName + "/");
    var mySearchCaption = myItem.captions !== false
    myFolder.create();
    for (var i = 0; i < myItem.articles.articleMembers.length; i++) {
        var myObject = myItem.articles.articleMembers[i].itemRef;
        var myId = myItem.name + '-' + i + 1
        var myObjectName = myObjectNameResolver(myObject, myId)
        if (!myObjectName || myObject.visible != true) {
            myErrors.invalidItem.push(myId)
        }

        else {

            // Image will be cropped depending on the layout
            var myCurrent = {
                width: myObject.visibleBounds[3] - myObject.visibleBounds[1],
                height: myObject.visibleBounds[2] - myObject.visibleBounds[0]
            }

            var myPxProps = ['width', 'height'];

            if (myConfig.limit === 'height' || (myConfig.limit === 'adapt' && myCurrent.width < myCurrent.height)) {
                myPxProps.reverse()
            }

            var myResizePercentage = myConfig.dimn / myCurrent[myPxProps[0]];
            var myExportRes = Math.min((myResizePercentage * 72), 2400);

            var myBaseName = myTrimName(myObjectName)
            var myFile = myFileResolver(myFolder, myBaseName, myConfig.ext, myConfig.rw)

            var myExportFormat;
            var myQuality;

            if (myConfig.ext === 'jpg') {

                myExportFormat = ExportFormat.JPG
                myQuality = myConfig.res === "max" ? JPEGOptionsQuality.MAXIMUM : JPEGOptionsQuality.HIGH
                app.jpegExportPreferences.properties = {
                    antiAlias: true,
                    embedColorProfile: false,
                    exportResolution: myExportRes,
                    jpegColorSpace: JpegColorSpaceEnum.RGB,
                    jpegQuality: myQuality,
                    jpegRenderingStyle: JPEGOptionsFormat.PROGRESSIVE_ENCODING,
                    simulateOverprint: true,
                    useDocumentBleeds: false
                };

            } else {
                myExportFormat = ExportFormat.PNG_FORMAT
                myQuality = myConfig.res === "max" ? PNGQualityEnum.MAXIMUM : PNGQualityEnum.HIGH
                app.pngExportPreferences.properties = {
                    antiAlias: true,
                    exportResolution: myExportRes,
                    pngColorSpace: PNGColorSpaceEnum.RGB,
                    pngExportRange: PNGExportRangeEnum.EXPORT_ALL,
                    simulateOverprint: true,
                    pngQuality: myQuality,
                    transparentBackground: true
                };

            }
            try {
                  myObject.exportFile(myExportFormat, myFile, false);

                if (myConfig.html) {
                    var myCaption = false

                    if (mySearchCaption && myObject.name !== "" && myItem.captions[myBaseName]) {
                        myCaption = myItem.captions[myBaseName]
                    }

                    var myPx = {
                        width: myConfig.dimn,
                        height: myConfig.dimn
                    }
                    myPx[myPxProps[1]] = Math.round(myCurrent[myPxProps[1]] * myResizePercentage)
                    myHtmlWriter(myFolder, myBaseName, myPx, myCaption)
                }
            }
            catch (myError) {
                myErrors.exportFail.push(myId)
            }
        }

    }
}

function myHtmlWriter(myFolder, myBaseName, myPx, myCaption) {
    var myHtmlFile = myFileResolver(myFolder, myBaseName, 'html', myConfig.rw)
    var myImgClass = "h"
    if (myPx.width < myPx.height) {
        myImgClass = 'v'
    } else if (myPx.width === myPx.height) {
        myImgClass = 's'
    }
    var myCaptionSnippet = ''
    var myImgAlt = myBaseName
    if (myCaption) {
        var myCaptionParts = myCaption.split(/\r?\n|\r|\n/g)
        myImgAlt = myCaptionParts[0]
        myCaptionSnippet = myCaptionParser(myCaptionParts)
    }

    var myHtmlContent = myHtmlSnippet(myBaseName, myImgClass, myImgAlt, myPx.width, myPx.height, myCaptionSnippet)

    try {
        myHtmlFile.open("w");
        myHtmlFile.write(myHtmlContent);
        myHtmlFile.close();
    } catch (myError) {
        myErrors.exportFail.push(myBaseName + '-html')
    }

}

// Append a number to the file name if the file already exists
function myFileResolver(myFolder, myBaseName, myExt, overwrite) {
    var myFilePath = myFolder + "/" + myBaseName
    var myFileExt = "." + myExt

    var myFile = new File(myFilePath + myFileExt);
    if (!overwrite) {
        var n = 1;
        while (myFile.exists) {
            myFile = new File(myFilePath + "_" + String(n) + myFileExt);
            n++;
        }
    }
    return myFile
}


function myTrimName(myFileName) {
    var myString = myFileName.toString();
    var myLastSlash = myString.lastIndexOf(".");
    if (myLastSlash != -1) {
        myString = myString.slice(0, myLastSlash);
    }
    const myRegex = /\s/g;
    myString = myString.replace(myRegex, '-')
    return myString;
}

function myTrimPath(myLongPath) {
    var myString = myLongPath.toString();
    var myLastSlash = myString.lastIndexOf("/");
    var myPathName = myString.slice(0, myLastSlash);
    return myPathName;
}