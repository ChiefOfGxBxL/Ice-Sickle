var https = require('https');
var fs = require('fs-extra');
var Path = require('path');

module.exports = {

    /**
     * DownloadFile - Downloads a specified file from a remote endpoint
     * Thanks to: https://stackoverflow.com/a/22907134/8310458
     * @param  {String} url  Remote file to download
     * @param  {String} dest Destination on local file system to place file
     * @param  {Function} cb Callback function
     */
    DownloadFile: function(url, dest, cb) {
        const tarFile = Path.join(dest, 'ext.tgz');
        fs.ensureDirSync(dest);

        var file = fs.createWriteStream(tarFile);
        var request = https.get(url, function(response) {
            console.log('https response');
            response.pipe(file);
            file.on('finish', function() {
                console.log('finish');
                file.close(cb);  // close() is async, call cb after close completes.
            });
        }).on('error', function(err) { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message, false);
        });
    }

}
