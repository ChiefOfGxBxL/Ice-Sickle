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
        console.log('Load map', projectDir);
        Map.__Dir = Path.resolve(projectDir);
        console.log('Load dir', Map.__Dir);

        var loadJson = function(file, def) {
            var path = Path.resolve(projectDir, file);

            if(!fs.existsSync(path)) {
                return def;
            }

            return fs.readJsonSync(path);
        }

        // Clear the global map when we are loading a new one
        Map.info =                  loadJson('info.json', {});
        Map.units =                 loadJson('units.json', []);
        Map.doodads =               loadJson('doodads.json', []);
        Map.terrain =               loadJson('terrain.json', {});
        Map.regions =               loadJson('regions.json', []);
        Map.cameras =               loadJson('cameras.json', []);
        Map.sounds =                loadJson('sounds.json', []);
        Map.objects.units =         loadJson('/objects/units.json', {});
        Map.objects.items =         loadJson('/objects/items.json', {});
        Map.objects.destructables = loadJson('/objects/destructables.json', {});
        Map.objects.doodads =       loadJson('/objects/doodads.json', {});
        Map.objects.abilities =     loadJson('/objects/abilities.json', {});
        Map.objects.buffs =         loadJson('/objects/buffs.json', {});
        Map.objects.upgrades =      loadJson('/objects/upgrades.json', {});
        Map.imports =               loadJson('imports.json', []);
        Map.strings =               loadJson('strings.json', {});

        console.log("Loading project: " + Map.info.name);
        console.log(" @ " + projectDir);

        return this; // in case the calling function wants the instance right away
    },

    Save: function() {
        // Takes the global map object and dumps it into its separate project files
        var writeJson = function(file, data) {
            console.log('Writing file to', Path.resolve(Map.__Dir, file));

            fs.outputJsonSync(
                Path.resolve(Map.__Dir, file),
                data
            ); // Overwrites, and ensures file exists
        };

        writeJson('info.json', Map.info);
        writeJson('units.json', Map.units);
        writeJson('doodads.json', Map.doodads);
        writeJson('terrain.json', Map.terrain);
        writeJson('regions.json', Map.regions);
        writeJson('cameras.json', Map.cameras);
        writeJson('sounds.json', Map.sounds);
        writeJson('/objects/units.json', Map.objects.units);
        writeJson('/objects/items.json', Map.objects.items);
        writeJson('/objects/destructables.json', Map.objects.destructables);
        writeJson('/objects/doodads.json', Map.objects.doodads);
        writeJson('/objects/abilities.json', Map.objects.abilities);
        writeJson('/objects/buffs.json', Map.objects.buffs);
        writeJson('/objects/upgrades.json', Map.objects.upgrades);
        writeJson('imports.json', Map.imports);
        writeJson('strings.json', Map.strings);

        console.log("Saved map " + Map.info.name);
        console.log(" @ " + Map.__Dir);
        return this;
    },

    Compile: function() {
        // NOT IMPLEMENTED
        return false;
    }
}

setEmptyMap();
module.exports = Map;
