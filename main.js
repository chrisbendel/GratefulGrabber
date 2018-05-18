var xhr = {};

fetchShow().then(show => {
  let identifier = show.metadata.identifier;
  let base = "https://archive.org/download/" + identifier;
  let mp3_files = _.pick(show.files, function(file) { return file.format === "VBR MP3" });
  let info_file = _.pick(show.files, function(file) { return file.format === "Text" });
  info_file = base + Object.keys(info_file)[0]
  let showName = show.metadata.date + " " + show.metadata.venue;
  let deferreds = [], zip = new JSZip();
  let songs, url_links;

  /* Shared download links between Indivual and Zip features */
  url_links = Object.keys(mp3_files).map(function(key, index) {
    data = mp3_files[key];
    var url = base + key;
    var title = data.title;
    var ret = {}
    title = title
      .replace("*", "")
      .replace("->", "")
      .replace(">", "")
      .replace("/", "")
      .replace("?", "")
      .replace("<", "")
      .replace(/\/+/g, "")
      .replace("|", "");
    return { 'title': (index + 1) + ". " + title, 'url': url }
  })

  /* Start Individual Songs */
  songs = url_links.map(function(obj) {
    var trackLink =
      '<a href="' +
      obj['url'] +
      '"class="downloadfile dropdown-item" download>' +
      obj['title'] +
      "</a>";
    return trackLink;
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
      var template = Mustache.to_html(req.responseText, {
        songs: songs,
        img: randomImage
      });
      $("#theatre-ia-wrap").after(template);
    }
  };
  req.send(null);

  /* Start of Download Zip */

  $("body").on("click", "#downloadAll", function() {
    url_links.forEach(function(obj, index) {
      deferreds.push(deferredAddZip(obj['url'], obj['title'] + ".mp3", zip, Object.keys(url_links).length));
    });    
    
    deferreds.push(deferredAddZip(info_file, "info.txt", zip, Object.keys(url_links).length));
      
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

function deferredAddZip(url, filename, zip, numTracks) {
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
    function(oEvent) { 
      return doProgress(oEvent, numTracks); 
    }
  );
  return deferred;
}

async function fetchShow() {
  let data = await (await fetch(window.location.href + "&output=json")).json();
  return data;
}

function doProgress(oEvent, numTracks) {
  if (oEvent.lengthComputable) {
    var percentComplete = oEvent.loaded / oEvent.total;
    updatePercent(oEvent.target.responseURL, percentComplete);
    var percent = getTotalPercent() / numTracks;
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
