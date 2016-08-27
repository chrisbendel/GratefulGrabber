var xhr_requests = {};

function doProgress(oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    var oldPercent = getTotalPercent();
    updatePercent(oEvent.target.responseURL, percentComplete);
    var newPercent = getTotalPercent();
    if (newPercent > oldPercent) {
      document.getElementById("progress").innerHTML = "Compressing " + getTotalPercent() + " % ";
    }
  }

  function updatePercent(url, percent) {
    xhr_requests[url] = percent;
  }

  function getPercents() {
    return xhr_requests;
  }

  function getTotalPercent() {

    var array = _.map(getPercents(), function(value, index) {
      return value;
    });
    var sum = _.reduce(array, function(a, b) {
      return a + b;
    }, 0);
    return Math.floor((sum / array.length) * 100);
  }
}

function deferredAddZip(url, filename, zip) {
  var deferred = $.Deferred();
  JSZipUtils.getBinaryContent(url,
    function startDownload(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        zip.file(filename, data, {
          binary: true
        });
        deferred.resolve(data);
      }
    }, doProgress);
  return deferred;
}

function download_all(urls) {
  var zip = new JSZip();
  var deferreds = [];

  $.each(urls, function(k, v) {
    var song = JSON.parse(v)
    var url = song.sources[0].file;
    var full_url = "https://archive.org" + url;

    var title = url.substring(url.lastIndexOf('/') + 1);
    deferreds.push(deferredAddZip(full_url, title, zip));
  });

  $.when.apply($, deferreds).done(function() {
    var blob = zip.generate({
      type: "blob"
    });
    $("#downloadAll").prop("disabled", false);
    $("#progress").text("Compressing: Finished");
    var url = window.location.pathname;
    var show = url.substring(url.lastIndexOf('/') + 1);
    saveAs(blob, show + ".zip");
  }).fail(function(err) {
    console.log("Ahh craig:" + err);
  });
};

function startApp() {
  console.log('jwloaded');
}

var req = new XMLHttpRequest();
req.open("GET", chrome.extension.getURL('box.html'), true);
req.onreadystatechange = function() {
  if (req.readyState == 4 && req.status == 200) {
    console.log('loaded');
    var template = Mustache.to_html(req.responseText, {
      name: "Chris"
    });
    $('#theatre-ia-wrap').after(template);
  }
};
req.send(null);

var player = null;

var myContent = $('<p />');
var myList = [];
var numOfSongs = jwplayer('jw6').getPlaylist().length;

for (var i = 0; i < numOfSongs; i++) {
  var song = jwplayer('jw6').getPlaylist()[i].file;
  var title = jwplayer('jw6').getPlaylist()[i].title;
  var newUrl = "http://www.archive.org".concat(song);
  myList[i] = newUrl;
  myContent.append("<a href=\"" + newUrl + "\" class=\"downloadfile\"  download>" + title + "</a>");
  myContent.append("<br/>");
}

$('#downloadBox').append("<h2 style=\"text-align:center;\">Grateful Grabber</h2> <br/> <p style=\"text-align:center\"> Download This Show!</p>");
$('#downloadBox').append("<input id=\"downloadAll\" style =\"width:125px; font-weight: bold; ; height: auto; white-space:normal; border-radius:7px;\" type=\"button\" value=\"As Zip (Folder)\" /> <hr/>");
$('#downloadBox').append("<input id=\"downloadIndividually\" style =\"font-weight: bold; width:125px;; height: auto; white-space:normal; border-radius:7px;\" type=\"button\" value=\"Individual Songs (No Folder)\" /> <hr/>");
$('#downloadBox').append(myContent);

$('#downloadAll').click(function() {
  $("#downloadAll").prop("disabled", true);
  if ($("#progress").length == 0) {
    $("<div id='progress'></div>").insertAfter("#downloadAll");
  }
  download_all(myList);
});

$('#downloadIndividually').click(function() {
  for (i = 0; i < numOfSongs.length; i++) {
    $('.downloadfile')[i].click();
  };
});
