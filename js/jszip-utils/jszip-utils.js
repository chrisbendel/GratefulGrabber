/*!

JSZipUtils - A collection of cross-browser utilities to go along with JSZip.
<http://stuk.github.io/jszip-utils>

(c) 2014 Stuart Knightley, David Duponchel
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip-utils/master/LICENSE.markdown.

*/
!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.JSZipUtils=e():"undefined"!=typeof global?global.JSZipUtils=e():"undefined"!=typeof self&&(self.JSZipUtils=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var JSZipUtils = {};

JSZipUtils.getBinaryContent = function(path, callback, updateProgress) {
    try {

        var xhr = new window.XMLHttpRequest();
        xhr.addEventListener("progress", updateProgress, false);
        xhr.open('GET', path, true);

        if ("responseType" in xhr) {
            xhr.responseType = "arraybuffer";
        }

        // older browser
        if(xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
        }

        xhr.onreadystatechange = function(evt) {
            var file, err;
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    file = null;
                    err = null;
                    try {
                        file = xhr.response;
                    } catch(e) {
                        err = new Error(e);
                    }
                    callback(err, file);
                } else {
                    /* AHHH CALLBACK HELLLLLL */
                    callback(new Error("Ajax error for " + path + " : " + this.status + " " + this.statusText), null);
                }
            }
        };

        xhr.send();

    } catch (e) {
        callback(new Error(e), null);
    }
};

// export
module.exports = JSZipUtils;

// enforcing Stuk's coding style
// vim: set shiftwidth=4 softtabstop=4:

},{}]},{},[1])
(1)
});
;