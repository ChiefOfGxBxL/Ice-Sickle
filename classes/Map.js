var Path = require('path'),
    fs = require('fs-extra');

function setEmptyMap() {
    Map.info = {};
    Map.units = [];
    Map.doodads = [];
    Map.terrain = {};
    Map.regions = [];
    Map.cameras = [];
    Map.sounds = [];

    Map.objects = {
        units: {},
        items: {},
        destructables: {},
        doodads: {},
        abilities: {},
        buffs: {},
        upgrades: {}
    };

    Map.imports = [];
    Map.strings = {};
}

var Map = {
    __Dir: '', // path to current map folder; blank if no map is open
    //__Dirty: false,

    // info: {},
    // units: [],
    // doodads: [],
    // terrain: {},
    // regions: [],
    // cameras: [],
    // sounds: [],
    // objects: {
    //     units: {},
    //     items: {},
    //     destructables: {},
    //     doodads: {},
    //     abilities: {},
    //     buffs: {},
    //     upgrades: {},
    // },
    // imports: [],
    // strings: {},

    Create: function(name) {
        // TODO: if the __Dirty is set, notify the user before continuing
        // since we don't want to overwrite changes

        Map.__Dir = Path.resolve('./' + name); // TODO: let user choose path with file chooser
        fs.ensureDirSync(Map.__Dir); // Creates the path if it doesn't exist

        // Set new Map object
        setEmptyMap();

        // Save the Map
        return Map.Save();
    },

    Load: function(projectDir) {
        // TODO: verify this is a valid Ice-Sickle project by checking for
        // presence of info.json, .sickle file, etc.
        var mapObj = {objects: {}};

        mapObj.__Dir = Path.resolve(projectDir);

        if(!fs.existsSync(mapObj.__Dir)) {
            console.error('This map does not exist!', mapObj.__Dir);
            return false;
        }

        var loadJson = function(file, def) {
            var path = Path.resolve(projectDir, file);

            if(!fs.existsSync(path)) {
                return def;
            }

            return fs.readJsonSync(path);
        }

        // Clear the global map when we are loading a new one
        mapObj.info =                  loadJson('info.json', {});
        mapObj.units =                 loadJson('units.json', []);
        mapObj.doodads =               loadJson('doodads.json', []);
        mapObj.terrain =               loadJson('terrain.json', {});
        mapObj.regions =               loadJson('regions.json', []);
        mapObj.cameras =               loadJson('cameras.json', []);
        mapObj.sounds =                loadJson('sounds.json', []);
        mapObj.objects.units =         loadJson('objects/units.json', {});
        mapObj.objects.items =         loadJson('objects/items.json', {});
        mapObj.objects.destructables = loadJson('objects/destructables.json', {});
        mapObj.objects.doodads =       loadJson('objects/doodads.json', {});
        mapObj.objects.abilities =     loadJson('objects/abilities.json', {});
        mapObj.objects.buffs =         loadJson('objects/buffs.json', {});
        mapObj.objects.upgrades =      loadJson('objects/upgrades.json', {});
        mapObj.imports =               loadJson('imports.json', []);
        mapObj.strings =               loadJson('strings.json', {});

        console.log("Loading project: " + mapObj.info.name);
        console.log(" @ " + projectDir);

        return mapObj; // in case the calling function wants the instance right away
    },

    Save: function(mapObj) {
        // No map is open to save
        //if(!Map.__Dir) return false;

        // Takes the global map object and dumps it into its separate project files
        var writeJson = function(file, data) {
            console.log('Writing file to', Path.resolve(mapObj.__Dir, file));

            fs.outputJsonSync(
                Path.resolve(mapObj.__Dir, file),
                data
            ); // Overwrites, and ensures file exists
        };

        writeJson('info.json',                   mapObj.info);
        writeJson('units.json',                  mapObj.units);
        writeJson('doodads.json',                mapObj.doodads);
        writeJson('terrain.json',                mapObj.terrain);
        writeJson('regions.json',                mapObj.regions);
        writeJson('cameras.json',                mapObj.cameras);
        writeJson('sounds.json',                 mapObj.sounds);
        writeJson('objects/units.json',          mapObj.objects.units);
        writeJson('objects/items.json',          mapObj.objects.items);
        writeJson('objects/destructables.json',  mapObj.objects.destructables);
        writeJson('objects/doodads.json',        mapObj.objects.doodads);
        writeJson('objects/abilities.json',      mapObj.objects.abilities);
        writeJson('objects/buffs.json',          mapObj.objects.buffs);
        writeJson('objects/upgrades.json',       mapObj.objects.upgrades);
        writeJson('imports.json',                mapObj.imports);
        writeJson('strings.json',                mapObj.strings);

        console.log("Saved map " + mapObj.info.name);
        console.log(" @ " + mapObj.__Dir);
        return this;
    },

    Compile: function() {
        // NOT IMPLEMENTED
        return false;
    }
}

setEmptyMap();
module.exports = Map;
