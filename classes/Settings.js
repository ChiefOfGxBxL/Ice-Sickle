const fs = require('fs-extra'),
    Path = require('path');

var _settings = { // Private storage of settings
        global: {},
        local: {}
    },
    _currPath; // Path to the settings.json file

var Settings = {

    GetGlobal: (name) => { 
        return _settings.global[name] || null;
        //return _settings.global[name];
    },
    GetLocal: (name) =>         {
        return _settings.local[name] || null;
        //return _settings.local[name];
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
            fs.writeFileSync(_currPath, '{"global": {}, "local": {}}');
        }

        _settings = fs.readJsonSync(_currPath);
    }

}

module.exports = Settings;
