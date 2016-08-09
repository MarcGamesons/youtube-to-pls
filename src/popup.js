document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('create');
  checkPageButton.addEventListener('click', function() {

   doRequest();

  }, false);
}, false);


var textFile = null;

function makeTextFile(text) {
	var data = new Blob([text], {type: 'text/plain'});
	
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
			return String("https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId="+String(playlistId)+"&maxResults=50&pageToken="+String(pageToken)+"&key=AIzaSyD_C8aMtHKJ9WhJlkgn50_ZTuVGFFaK9vk");
		} else {
			console.log('Warning: "pageToken" was not defined!');
			return String("https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId="+String(playlistId)+"&maxResults=50&key=AIzaSyD_C8aMtHKJ9WhJlkgn50_ZTuVGFFaK9vk");
		}
	} else {
		console.log('Error: "playlistId" was not defined! Aborted!');
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

	var str = textbox.value;
	var value = str.split("list=");

	if(canRequest) {
		if(url == null) {
			nextURL = createURL(value[1], null);
			xhr.open('GET', nextURL, true);
			xhr.send();
		} else {
			xhr.open('GET', createURL(value[1], nextToken), true);
			xhr.send();
		}
	}
}

var myText = new Array();
var identifier = 0;
var totalEntries = 9999;

function saveInArray(data) {
	myText[identifier] = data;
}

function processRequest(e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
		response = JSON.parse(xhr.responseText);
		nextToken = response.nextPageToken;
		totalEntries = response.pageInfo.totalResults;

		for(i=0; i < response.items.length; i++) {
			if(identifier == 0) {
				saveInArray("\[playlist\]\n\n");
				identifier++;
				saveInArray("File" + identifier + "=https://youtube.com/watch?v=" + response.items[i].contentDetails.videoId + "\n\n");
				identifier++;
			} else {
				myText[identifier] = "File" + identifier + "=https://youtube.com/watch?v=" + response.items[i].contentDetails.videoId + "\n\n";
				identifier++;
				if(myText.length == totalEntries) {
					count  = identifier - 1;
					myText[identifier] = "NumberOfEntries="+count;

					var text = document.getElementById('generatedtext');

					for (var i = 0; i < myText.length; i++) {
						if(text.value == "") {
							text.value = String(myText[i]);
						} else {
							text.value = text.value + String(myText[i]);
						}
					}

					var link = document.getElementById('downloadlink');					
					link.href = makeTextFile(generatedtext.value);
					link.style.display = 'block';
					var know = document.getElementById("know");
					know.style.display = "block";
				}
			}
		}

		if(nextToken != null) {
			console.log(nextToken);
			nextURL = createURL(textbox.value, nextToken);
			doRequest(nextURL);
		} else if(nextToken == null) {
			canRequest = false;
		}
	}
}