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

function noteLine(key, value)
{
  if (Array.isArray(value)) {
    value = value[0];
  }
  return key + ": " + value + "\n";
}

function trackListing(description)
{
  return description[0].split(",").map(function(track) { return track.trim(); }).join("\n")
}

function buildNotes(metadata)
{
  /*
  Difference in JSON vs UI, UI has less/better keys, JSON has waayyy more info
  Some metadata is either an array/string, the pattern so far is first element is used (at least in my Dead in Alaska example).
  Maybe just display all metadata with weird keys like "Creator" and "Coverage" ?? 
  */

  let notes = "";

  notes += noteLine("Collection", metadata['collection'])
  notes += noteLine("Band/Artist", metadata['creator'])
  notes += noteLine("Has_mp3", metadata['has_mp3'])
  notes += noteLine("Identifier", metadata['identifier'])
  notes += noteLine("Lineage", metadata['lineage'])
  notes += noteLine("Location", metadata['coverage'])
  notes += noteLine("Shndiscs", metadata['shndiscs'])
  notes += noteLine("Source", metadata['source'])
  notes += noteLine("Type", metadata['type'])
  notes += noteLine("Venue", metadata['venue'])
  notes += noteLine("Year", metadata['year'])

  notes += "\n\n";

  notes += trackListing(metadata["description"]);

  notes += "\n\n";

  notes += metadata['notes'][0];
  notes += "\n";
  return notes;
}

async function fetchShow() {
  let data = await (await fetch(window.location.href + "&output=json")).json();
  return data;
}

$("body").on("click", "#downloadAll", function() {

  fetchShow().then(show => {
    let identifier = show.metadata.identifier;
    let base = "https://archive.org/download/" + identifier;
    let text = base + show.files["/info.txt"];
    let showName = show.metadata.date + " " + show.metadata.venue;
    let mp3_files = _.pick(show.files, function(file) { return file.format === "VBR MP3" });
    let notes = buildNotes(show.metadata);
    let deferreds = [], zip = new JSZip();

    Object.keys(mp3_files).forEach(function(key){
      data = mp3_files[key];
      var url = base + key;
      var title = data.title;
      title = title
        .replace("*", "")
        .replace("->", "")
        .replace(">", "")
        .replace("/", "")
        .replace("?", "")
        .replace("<", "")
        .replace(/\/+/g, "")
        .replace("|", "");
      deferreds.push(deferredAddZip(url, title + ".mp3", zip));
    });

    zip.file("notes.txt", notes);

    $.when
      .apply($, deferreds)
      .done(function() {
        var blob = zip.generate({
          type: "blob"
        });

        saveAs(blob, showName + ".zip");
      })
      .fail(function(err) {
        Error(err);
      });

  });

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
