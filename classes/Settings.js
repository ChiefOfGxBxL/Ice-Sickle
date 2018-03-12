const fs = require('fs-extra'),
    Path = require('path');

var _settings = { // Private storage of settings
        global: {
            recentMaps: []
        },
        local: {}
    },
    _currPath; // Path to the settings.json file

var Settings = {

    GetGlobal: (name) => {
        if(!_settings.global) _settings.global = {};
        return _settings.global[name] || null;
    },
    GetLocal: (name) => {
        if(!_settings.local) _settings.local = {};
        return _settings.local[name] || null;
    },
    SetGlobal: (name, data) =>  { _settings.global[name] = data; },
    SetLocal: (name, data) =>   { _settings.local[name] = data; },

    Save: function() {
        fs.ensureFileSync(_currPath);
        fs.writeJsonSync(_currPath, _settings);
    },

    Load: function(dir) {
        // Load the settings into memory
        _currPath = Path.resolve(dir, 'settings.json');

        if(!fs.existsSync(_currPath)) {
            // Ensure the settings.json file exists with
            // at least empty `global` and `local` objects
            console.log('Settings.json file is missing; writing & using default empty file', _settings);
            fs.writeJsonSync(_currPath, _settings);
        }

        _settings = fs.readJsonSync(_currPath);
    }

}

module.exports = Settings;
