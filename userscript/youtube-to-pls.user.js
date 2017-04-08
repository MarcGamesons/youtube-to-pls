// ==UserScript==
// @name         YouTube to PLS
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Create a PLS file out of any YouTube playlist
// @author       MarcGamesons
// @include        https://www.youtube.com/playlist*
// @include        https://www.youtube.com/watch*list*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var node = document.createElement("button");
    node.classList.add("create-pls-file", "yt-uix-button", "yt-uix-button-size-default", "yt-uix-button-default");
    var textnode = document.createTextNode("Create PLS file");
    node.appendChild(textnode);
    var element = document.getElementsByClassName("playlist-actions");
    //var element = document.getElementsByClassName("playlist-nav-controls");
    element[0].appendChild(node);
    
    //generatedtext
    var generatedtext = document.createElement("textarea");
    generatedtext.id = "generatedtext";
    generatedtext.style.display = "none";
    element[0].appendChild(generatedtext);
    
    //link
    var link = document.createElement("a");
    link.id = "downloadlink";
    link.style.display = "none";
    element[0].appendChild(link);
    
    //var plsWait = document.getElementById('plswait');

    var checkPageButton = document.getElementsByClassName('create-pls-file');
    checkPageButton[0].addEventListener('click', function() {

        //plsWait.innerHTML = "This can take a moment, please wait!";
        doRequest();

    }, false);

    var textFile = null;

    function makeTextFile(text) {
        text = text.replace(/\n/g, "\r\n");
        var data = new Blob([text], {encoding:"UTF-8", type:"text/plain;charset=UTF-8"});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if(textFile !== null) {
            window.URL.revokeObjectURL(textFile);
        }

        textFile = window.URL.createObjectURL(data);

        return textFile;
    }

    // Needs playlistId as first input. Second value, pageToken, can be null.
    // Can return a created url for api request with or without pagetoken.
    function createURL(playlistId, pageToken) {
        if(playlistId != null) {
            if(pageToken != null) {
                return String("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId="+String(playlistId)+"&maxResults=50&pageToken="+String(pageToken)+"&key=AIzaSyD_C8aMtHKJ9WhJlkgn50_ZTuVGFFaK9vk");
            } else {
                // console.log('Warning: "pageToken" was not defined!');
                // test ID: UUHO3sRJtKFlHQGW-zLGt5yw https://www.youtube.com/playlist?list=UUHO3sRJtKFlHQGW-zLGt5yw
                return String("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId="+String(playlistId)+"&maxResults=50&key=AIzaSyD_C8aMtHKJ9WhJlkgn50_ZTuVGFFaK9vk");
            }
        } else {
            // console.log('Error: "playlistId" was not defined! Aborted!');
            return null;
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", processRequest, false);

    var response, nextURL, nextToken;
    var canRequest = true;

    function parseURL(url) {

    }

    function doRequest(url) {

        var str = window.location.href;
        var value = str.split("list=");

        if(canRequest) {
            if(url === null) {
                nextURL = createURL(value[1], null);
                xhr.open('GET', nextURL, true);
                xhr.send();
            } else {
                xhr.open('GET', createURL(value[1], nextToken), true);
                xhr.send();
            }
        }
    }

    var myId = new Array();
    var myTitle = new Array();
    var identifier = 0;
    var totalEntries = 9999;

    function saveIdInArray(data) {
        myId[identifier] = data;
    }

    function saveTitleInArray(data) {
        myTitle[identifier] = data;
    }

    function processRequest(e) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // console.log("success!");
            response = JSON.parse(xhr.responseText);
            nextToken = response.nextPageToken;
            totalEntries = response.pageInfo.totalResults;

            for(i=0; i < response.items.length; i++) {
                if(identifier === 0) {
                    saveIdInArray("\[playlist\]\n");
                    saveTitleInArray("\n");
                    // console.log("Wrote some data " + identifier);
                    identifier++;
                    saveTitleInArray("Title" + identifier + "=" + response.items[i].snippet.title + "\n")
                    saveIdInArray("File" + identifier + "=https://youtube.com/watch?v=" + response.items[i].snippet.resourceId.videoId + "\n\n");
                    // console.log("Wrote some data " + identifier);
                    identifier++;
                } else {
                    myTitle[identifier] = "Title" + identifier + "=" + response.items[i].snippet.title + "\n";
                    myId[identifier] = "File" + identifier + "=https://youtube.com/watch?v=" + response.items[i].snippet.resourceId.videoId + "\n\n";
                    // console.log("Wrote some data " + identifier);
                    identifier++;
                    // console.log(myId.length + " - " + totalEntries);
                }
            }

            if(nextToken !== null) {
                // console.log(nextToken);
                nextURL = createURL(textbox.value, nextToken);
                doRequest(nextURL);
            } else if(nextToken === null) {
                canRequest = false;
                var count = identifier - 1;
                myTitle[identifier] = "";
                myId[identifier] = "NumberOfEntries="+count;

                // console.log("All data written!");

                var text = document.getElementById('generatedtext');

                for (var i = 0; i < myId.length; i++) {
                    if(text.value === "") {
                        text.value = String(myId[i]);
                        text.value = text.value + String(myTitle[i]);
                    } else {
                        text.value = text.value + String(myTitle[i]);
                        text.value = text.value + String(myId[i]);
                    }
                }

                text.value = text.value + String("\nVersion=2");

                var link = document.getElementById('downloadlink');
                link.href = makeTextFile(generatedtext.value);
                link.setAttribute("download", "playlist.pls");
                link.click();
            }
        } else if(xhr.readyState != 4 || xhr.status != 200) {
            console.log("ERROR:: Something went wrong!");
        }
    }
})();