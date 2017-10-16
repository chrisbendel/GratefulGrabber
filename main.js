var xhr = {};

var songs = [], object = [];

var list = $("#wrap").find(".container:last").find("script:last").html(),
  myList = list.match(/\{\"title\"(.*?\}\]\})/g);

_.each(myList, function(details) {
  details = JSON.parse(details);

  var url = "https://www.archive.org" + details.sources[0].file,
    trackLink =
      '<a href="' +
      url +
      '"class="downloadfile dropdown-item" download>' +
      details.title +
      "</a>";
  object.push(details);
  songs.push(trackLink);
});

var req = new XMLHttpRequest();

const imageNames = [
  "gdpainting.png",
  "neutron.jpg",
  "owl.png",
  "popeye.jpeg",
  "regularstealie.jpg",
  "rose.jpg",
  "spr1990.jpg",
  "sunflowers.jpg",
  "sunmoon.jpeg",
  "terrapin.jpg",
  "terrapins.jpg"
];

var images = [];
_.each(imageNames, function(name) {
  images.push(chrome.extension.getURL("icons/" + name));
});

var randomImage = images[Math.floor(Math.random() * images.length)];

req.open("GET", chrome.extension.getURL("box.html"), true);

req.onreadystatechange = function() {
  if (req.readyState == 4 && req.status == 200) {
    var individualSong;
    _.each(myList, function(track) {
      track = JSON.parse(track);
    });
    var template = Mustache.to_html(req.responseText, {
      songs: songs,
      img: randomImage
    });
    $("#theatre-ia-wrap").after(template);
  }
};
req.send(null);

function deferredAddZip(url, filename, zip) {
  var deferred = $.Deferred();
  JSZipUtils.getBinaryContent(
    url,
    function startDownload(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        zip.file(filename, data, {
          binary: true
        });
        deferred.resolve(data);
      }
    },
    doProgress
  );
  return deferred;
}

//Building our own text file with source information because archive blocks it on server
var notes = "";

var songList = $("#descript").text();
songList = songList.split(",");

var keys = $(".key")
  .map(function() {
    return $(this).text();
  })
  .get();

var values = $(".value")
  .map(function() {
    return $(this).text();
  })
  .get();

for (i = 0; i < keys.length; i++) {
  notes = notes + keys[i] + ": " + values[i] + "\n";
}
notes += "\n\n";

_.each(songList, function(song) {
  notes += song.trim() + "\n";
});

var showNotes = $(".content").text();
notes += "\n\n" + showNotes + "\n";

async function fetchShow() {
  let data = await (await fetch(window.location.href + "&output=json")).json();
  return data;
}

$("body").on("click", "#downloadAll", function() {

  fetchShow().then(show => {
    console.log(show);
    let identifier = show.metadata.identifier;
    let base = "https://archive.org/download/" + identifier;
    let text = base + show.files["/info.txt"];
    let showName = show.metadata.date + " " + show.metadata.venue;
    _.each(show.files, function (file) {
      console.log(file);
    });
  });

  var deferreds = [], zip = new JSZip();
  console.log(object, songs);
  // _.each(object, function(data) {
  //   var url = "https://www.archive.org" + data.sources[0].file;
  //   var title = data.title;
  //   title = title
  //     .replace("*", "")
  //     .replace("->", "")
  //     .replace(">", "")
  //     .replace("/", "")
  //     .replace("?", "")
  //     .replace("<", "")
  //     .replace(/\/+/g, "")
  //     .replace("|", "");
  //   deferreds.push(deferredAddZip(url, title + ".mp3", zip));
  // });

  // zip.file("notes.txt", notes);

  // $.when
  //   .apply($, deferreds)
  //   .done(function() {
  //     var blob = zip.generate({
  //       type: "blob"
  //     });

  //     saveAs(blob, showName + ".zip");
  //   })
  //   .fail(function(err) {
  //     Error(err);
  //   });
});

function doProgress(oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    updatePercent(oEvent.target.responseURL, percentComplete);
    var percent = getTotalPercent() / object.length;
    $("#progressBar").val(percent);
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
  var sum = _.reduce(
    array,
    function(a, b) {
      return a + b;
    },
    0
  );
  return sum;
}
