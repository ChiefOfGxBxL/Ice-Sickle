var Path = require('path'),
    fs = require('fs-extra'),
    klaw = require('klaw-sync'),
    Translator = require('wc3maptranslator'),
    {app} = require('electron');

function generateEmptyMapTiles(width, height) {
    var mapTiles = [];

    for(var i = 0; i < height; i++) {
        var tileRow = [];

        for(var j = 0; j < width; j++) {
            // Create a single tile and add it to row
            tileRow.push([
                8192, // height
                6000, // water height
                0, // default flags
                Math.floor(Math.random()*6), // tile (index of tilepalette array)
                0, // texture
                0, // cliff tile
                Math.random() < 0.05 ? (Math.random() < 0.02 ? 2 : 1) : 0 // layer
            ])
        }

        mapTiles.push(tileRow);
    }

    return mapTiles;
}

function setNewMap(name) {
    Map.info = {
      saves: 0,
      editorVersion: 0,
      map: {
        name: name,
        author: 'No author specified',
        description: 'Just Another WarCraft III Map',
        recommendedPlayers: 'Any',
        playableArea: {
          width: 52,
          height: 52
        },
        flags: {
          hideMinimapInPreview: false,
          modifyAllyPriorities: false,
          isMeleeMap: false,
          maskedPartiallyVisible: true,
          fixedPlayerSetting: false,
          useCustomForces: false,
          useCustomTechtree: false,
          useCustomAbilities: false,
          useCustomUpgrades: false,
          waterWavesOnCliffShores: true,
          waterWavesOnRollingShores: true
        },
        mainTileType: 'L', // char: tileset id
      },
      loadingScreen: {
        background: -1,
        path: '',
        text: '',
        title: '',
        subtitle: ''
      },
      prologue: {
        path: '',
        text: '',
        title: '',
        subtitle: ''
      },
      fog: {
        type: 0,
        startHeight: 3000,
        endHeight: 5000,
        density: 0.5,
        color: [0, 0, 0]
      },
      globalWeather: 'NONE',
      customSoundEnvironment: '', // string
      customLightEnv: '', // char - tileset id
      water: [0, 0, 0],
      camera: {
        bounds: [-2816, -3328, 2816, 2816, -2816, 2816, 2816, -3328],
        complements: [6, 6, 4, 8]
      },
      players: [{
          playerNum: 0,
          name: 'Player 1',
          type: 1,
          race: 1,
          startingPos: { x: 2368, y: 256 }
      }],
      forces: [{
          name: 'Force 1',
          flags: {
              allied: false,
              alliedVictory: false,
              shareVision: false,
              shareUnitControl: false,
              shareAdvUnitControl: false
          }
      }]
    };
    Map.units = [];
    Map.doodads = [];
    Map.terrain = {
        tileset: 'L',
        customtileset: false,
        tilepalette: ['Ldrt', 'Ldro', 'Ldrg', 'Lrok', 'Lgrs', 'Lgrd'],
        clifftilepalette: ['CLdi', 'CLgr'],
        map: { width: 64, height: 64 },
        tiles: generateEmptyMapTiles(64, 64)
    };
    Map.regions = [];
    Map.cameras = [];
    Map.sounds = [];
    Map.triggers = [];

    Map.objects = {
        units:          { original: {}, custom: {} },
        items:          { original: {}, custom: {} },
        destructables:  { original: {}, custom: {} },
        doodads:        { original: {}, custom: {} },
        abilities:      { original: {}, custom: {} },
        buffs:          { original: {}, custom: {} },
        upgrades:       { original: {}, custom: {} }
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
    // triggers: [],
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

    Create: function(projectPath, name) {
        // TODO: if the __Dirty is set, notify the user before continuing
        // since we don't want to overwrite changes

        Map.__Dir = projectPath; // TODO: let user choose path with file chooser

        fs.ensureDirSync(Map.__Dir); // Creates the path if it doesn't exist

        // Other subfolders
        fs.ensureDirSync(Path.join(Map.__Dir, 'imports'));
        fs.ensureDirSync(Path.join(Map.__Dir, 'objects'));
        fs.ensureDirSync(Path.join(Map.__Dir, 'triggers'));

        // Set new Map object
        setNewMap(name);
        return this;
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

        // Ensure that the objectFile contains `original` and `custom`,
        // even if they are empty
        Object.values(mapObj.objects).forEach((objectFile) => {
            objectFile.original = objectFile.original || {};
            objectFile.custom = objectFile.custom || {};
        });

        // Load any triggers that exist
        var triggerFilePaths = klaw(Path.resolve(projectDir, 'triggers'));
        mapObj.triggers = [];
        triggerFilePaths.forEach((triggerFile) => {
          // TODO: use a better, more resilient method here to get file name
          var fileName = triggerFile.path.split('\\').reverse()[0].split('.');

          mapObj.triggers.push({
            name: fileName[0],
            path: triggerFile.path,
            language: '.' + fileName[1],
            content: fs.readFileSync(triggerFile.path, {encoding: 'utf8'}).replace('\r\n', '\n')
          });
        });

        console.log(mapObj.triggers[0]);

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

        fs.ensureDirSync(Path.resolve(mapObj.__Dir), 'imports');
        fs.ensureDirSync(Path.resolve(mapObj.__Dir), 'objects');
        fs.ensureDirSync(Path.resolve(mapObj.__Dir), 'triggers');

        // Iterate through map triggers to save each file
        mapObj.triggers.forEach((trigger) => {
            // Save this trigger
            fs.writeFileSync(trigger.path, trigger.content);
        });

        console.log("Saved map " + mapObj.info.name);
        console.log(" @ " + mapObj.__Dir);
        return this;
    },

    Compile: function(baseDir, mapObj, languages, cleanup) {
        // Partially implemented...

        //
        // Setup: start with a fresh .compile folder in the baseDir
        //
        var outputPath = Path.join(baseDir, '.output');
            triggerPath = Path.join(baseDir, '.output', 'triggers'),
            w3xPath = Path.join(outputPath, 'map.w3x');

        fs.emptyDirSync(outputPath); // ensures empty .output, and ensures this folder exists
        fs.emptyDirSync(triggerPath);

        //
        // Translate main map files
        //
        var infoTranslator = new Translator.Info(mapObj.info);
        infoTranslator.write(outputPath);

        var terrainTranslator = new Translator.Terrain(mapObj.terrain);
        terrainTranslator.write(outputPath);

        //
        // Translate object editor entities
        //
        var unitTranslator = new Translator.Objects('units', mapObj.objects.units);
        unitTranslator.write(outputPath);

        var itemTranslator = new Translator.Objects('items', mapObj.objects.items);
        itemTranslator.write(outputPath);

        var destTranslator = new Translator.Objects('destructables', mapObj.objects.destructables);
        destTranslator.write(outputPath);

        //
        // Transpile each trigger according to its language
        //
        mapObj.triggers.forEach((trigger) => {
            // TODO: run the 'verify' function on the code first to validate syntax / logic
            languages[trigger.language].transpiler(trigger.content, function(err, jassCode) {
                if(err) {

                }
                else {
                    fs.writeFileSync(
                        Path.join(triggerPath, trigger.name + trigger.language),
                        jassCode
                    );
                }
            });
        })

        //
        // Merge all the .jass files
        //
        const
            scriptingPath = Path.join(app.getPath('documents'), 'icesickle', 'scripting'),
            scriptingJASSPath = Path.join(scriptingPath, 'languages', 'JASS'),
            JASS = require(scriptingJASSPath),
            mapJass = require('../assets/js/mapJass.js'),
            triggerFragments = klaw(triggerPath).map((pathObj) => { return pathObj.path; }),
            declarations = JASS.merge(
                // Array of file paths to each .jass file
                triggerFragments
            );

        // Generate the war3map.j file
        fs.writeFileSync(
            Path.join(outputPath, 'war3map.j'),
            mapJass(mapObj, declarations)
        );

        //
        // Create and populate the .w3x archive
        //
        var mpq = require('../mpqedit/MPQEditorQueue')(w3xPath);
        mpq.New();

        // Primary map files
        mpq.Add(Path.join(outputPath, 'war3map.j'),     'war3map.j');
        mpq.Add(Path.join(outputPath, 'war3map.w3i'), 'war3map.w3i');
        mpq.Add(Path.join(outputPath, 'war3map.w3e'), 'war3map.w3e');

        // Object editor files
        mpq.Add(Path.join(outputPath, 'war3map.w3b'), 'war3map.w3b');
        mpq.Add(Path.join(outputPath, 'war3map.w3t'), 'war3map.w3t');
        mpq.Add(Path.join(outputPath, 'war3map.w3u'), 'war3map.w3u');

        mpq.Flush();
        mpq.Execute();

        return true;
    }
}

setNewMap();
module.exports = Map;
