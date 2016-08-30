var xhr = {};

function resetMessage() {
  $("#result")
    .removeClass()
    .text("");
}

function Message(text) {
  resetMessage();
  $("#result")
    .addClass("alert alert-success")
    .text(text);
}

function Error(text) {
  resetMessage();
  $("#result")
    .addClass("alert alert-danger")
    .text(text);
}

function updatePercent(percent) {
  $("#progressBar").removeClass("hide")
    .find(".progress-bar")
    .attr("aria-valuenow", percent)
    .css({
      width: percent + "%"
    });
}

var urls = [],
  songs = [],
  object = [],
  songTitles = [];

var list = $('#wrap').find('.container:last').find('script:last').html();
var myList = list.match(/\{\"title\"(.*?\}\]\})/g);
_.each(myList, function(details) {
  details = JSON.parse(details);
  var url = "https://www.archive.org".concat(details.sources[0].file);
  trackLink = "<a href=\"" + url + "\" class=\"downloadfile\"  download>" + details.title + "</a>";
  object.push(details);
  songTitles.push(details.title);
  songs.push(trackLink);
  urls.push(url);
});

var req = new XMLHttpRequest();
req.open("GET", chrome.extension.getURL('box.html'), true);
req.onreadystatechange = function() {
  if (req.readyState == 4 && req.status == 200) {
    var individualSong;
    _.each(myList, function(track) {
      track = JSON.parse(track);
    });
    var template = Mustache.to_html(req.responseText, {
      songs: songs,
    });
    $('#theatre-ia-wrap').after(template);
  }
};
req.send(null);


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

$('body').on('click', '#downloadAll', function() {
  resetMessage();
  var zip = new JSZip();
  var deferreds = [];
  var showName = $(".key-val-big:contains('Published')").find('a:first').text();

  _.each(object, function(data) {
    var url = "https://www.archive.org" + data.sources[0].file;
    var title = data.title;
    deferreds.push(deferredAddZip(url, title + ".mp3", zip));
  });

  $.when.apply($, deferreds).done(function() {
    var blob = zip.generate({
      type: "blob"
    });

    saveAs(blob, showName + ".zip");
    Message("done !");
  }).fail(function(err) {
    Error(err);
  });
});

function doProgress(oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    var oldPercent = getTotalPercent();
    updatePercent(oEvent.target.responseURL, percentComplete);
    var newPercent = getTotalPercent();
    if (newPercent > oldPercent) {
      $('#progressBar').css('width', getTotalPercent() + '%').attr('aria-valuenow', getTotalPercent());
    }
  }

  function updatePercent(url, percent) {
    xhr[url] = percent;
  }

  function getPercents() {
    return xhr;
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
