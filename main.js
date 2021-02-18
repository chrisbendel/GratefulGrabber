let s = document.createElement('script');

// s.src = chrome.runtime.getURL('main.js');
// s.onload = function() {
//   this.remove();
// };

let x = document.createElement('script');
x.src = chrome.runtime.getURL("js/filesaver/FileSaver.min.js");
x.onload = function() {
  this.remove();
};

(document.head || document.documentElement).appendChild(s);
(document.head || document.documentElement).appendChild(x);

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

let images = [];
_.each(imageNames, function(name) {
  images.push(chrome.runtime.getURL("icons/" + name));
});

let randomImage = images[Math.floor(Math.random() * images.length)];

let totals = [];
let progressMap = {};

fetchShow().then(show => {
  console.log('show:', show);
  let identifier = show.metadata.identifier;
  let base = "https://archive.org/download/" + identifier;
  let mp3_files = _.pick(show.files, function(file) { return file.format === "VBR MP3" });
  let info_file = _.pick(show.files, function(file) { return file.format === "Text" });
  console.log(info_file);
  info_file = base + Object.keys(info_file)[0]
  let showName = show.metadata.date + " " + show.metadata.venue;
  console.log(mp3_files);
  console.log('info file', info_file);
  let zip = new JSZip();
  let songs, url_links;
  let totalSize = _.reduce(mp3_files, (result, value) => result + (parseInt(value['size']) || 0), 0);
  console.log(totalSize);
  /* Shared download links between Indivual and Zip features */
  url_links = Object.keys(mp3_files).map(function(key, index) {
    let data = mp3_files[key];
    let url = base + key;
    let title = data.title || data.original;
    title = title.replace(/-|[^-_,A-Za-z0-9 ]+/g,'').trim();
    return {
      'title': (index + 1) + ". " + title,
      'track': title, 'url': url
    }
  });

  /* Start Individual Songs */
  songs = url_links.map(function(obj) {
    let trackLink =
     `<div onClick="downloadSong('${obj['url']}', '${obj['track']}')"
           style="cursor: pointer; margin: 5px 0; text-align: left; padding-left: 2px;"
           onmouseover="this.style.backgroundColor='#d1ecf1'"
           onmouseout="this.style.backgroundColor='#FFF'"
           class="dropdown-item">
        ${obj['title']}
      </div>`;
    return trackLink;
  });

  let req = new XMLHttpRequest();


  // TODO Replace with fetch API
  req.open("GET", chrome.runtime.getURL("box.html"), true);

  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
      let template = Mustache.to_html(req.responseText, {
        songs: songs,
        img: randomImage
      });
      $("#theatre-ia-wrap").after(template);
    }
  };
  req.send(null);

  /* Start of Download Zip */
  $("body").on("click", "#downloadAll", function() {
    showInfoMessage("Downloading your show now. This may take a while, please be patient!\n Tip: Keep this browser tab open to download faster!");
    url_links.forEach(({title, track, url}) => {
      zip.file(`${title}.mp3`, urlToPromise(url, totalSize), {binary: true});
    });
    // let promises = [];
    // url_links.forEach(({title, track, url}) => {
    //   promises.push(fetch(url).then(res => res.blob()));
    //   // zip.file(`${title}.mp3`, urlToPromise(url, totalSize), {binary: true});
    // });
    // promiseAllInBatches(url_links.map(link => link.url), 3).then(res => {
    //   console.log(res);
    // })
    // while (promises.length) {
    //   // 100 at at time
    //   Promise.all(promises.splice(0, 3).map(f => Promise.resolve(f)) ).then(results => {
    //     console.log(results);
    //   });
    // }


    // Promise.all(promises).then(results => {
    //   console.log(results);
    // }).catch((err) => {
    //   console.log(err);
    // });

    // return;


    // TODO Zip file cors error
    // zip.file("info.txt", urlToPromise(`https://${show.server}${show.dir}/gd1995-07-06.9119.txt`), {binary: true});

    // zip.generateInternalStream({type:"blob"}).accumulate(function callback(err, content) {
    //   if (err) {
    //     console.error(err);
    //   }
    //   saveAs(content, `${showName}.zip`);
    //   $("#progressBar").val(0);
    //   progressMap = {};
    // }, function updateCallback(metadata) {
    //   $("#progressBar").val(metadata.percent|0);
    // });

    zip.generateAsync({type:"blob", compression: "DEFLATE", compressionOptions: {level: 9}}, function updateCallback(metadata) {
      // TODO Show message that the zip is downloading
      $("#progressBar").val(metadata.percent|0);
    }).then(function callback(blob) {
      saveAs(blob, `${showName}.zip`);
      $("#progressBar").val(0);
    }, function (e) {
      console.error(e);
    });
  });
});

async function promiseAllInBatches(items, batchSize) {
  let position = 0;
  let results = [];
  while (position < items.length) {
    const itemsForBatch = items.slice(position, position + batchSize);
    results = [...results, ...await Promise.all(itemsForBatch.map(item => fetch(item).then(res => res.blob())))];
    position += batchSize;
  }
  return results;
}

function urlToPromise(url, size) {
  return new Promise(function(resolve, reject) {
    JSZipUtils.getBinaryContent(url, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    }, (event) => {
      progressMap[event.target.responseURL] = {
        loaded: event.loaded
      };
      let totalProgress = _.reduce(progressMap, (result, value) => result + (parseInt(value['loaded']) || 0), 0) / size;
      $("#progressBar").val(totalProgress * 100);
    });
  });
}

showInfoMessage = (message) => {
  const bar = document.getElementById('progressBar');
  const msg = document.createElement('div');
  msg.className = 'alert alert-info';
  msg.textContent = message;
  bar.parentNode.insertBefore(msg, bar.nextSibling);
  setTimeout(() => {
    bar.parentNode.removeChild(msg);
  }, 7000);
}

function downloadSong(url, title) {
  showInfoMessage(`Download for "${title}" has started and will be finished shortly.`)
  fetch(url)
      .then(res => res.blob())
      .then(blob => {
        saveAs(blob, title);
      });
}

async function fetchShow() {
  return await (await fetch(window.location.href + "&output=json")).json();
}
