var fs = require('fs-extra'),
    Path = require('path'),
    currPath; // Stores the path to the settings.json file

var Settings = {
    Save: function() {
        fs.ensureFileSync(currPath);
        fs.writeJsonSync(currPath, Settings);
    },

    Load: function(dir) {
        // Load the settings into memory
        currPath = Path.resolve(dir, 'settings.json');

        if(!fs.existsSync(currPath)) {
            // Ensure the settings.json file exists with at least an empty object
            fs.writeFileSync(currPath, '{}');
        }


        var data = fs.readJsonSync(currPath);

        // Add them to the Settings object
        Object.keys(data).forEach((key) => {
            if(key.toLowerCase() !== 'save' && key.toLowerCase() !== 'load') {
                Settings[key] = data[key];
            }
        });
    }
}

module.exports = Settings;
