var Path = require('path');

var Map = {
    createNewMap: function(name) {
        var fs = require('fs-extra'),
            projectPath = Path.resolve('./' + name); // TODO: let user choose path with file chooser
        
        fs.mkdirSync(projectPath);
        fs.copySync('./assets/wc/empty-map-manifest.json', projectPath + '/' + 'project.json');
        
        fs.writeFileSync(projectPath + '/units.json', "[]");
        fs.writeFileSync(projectPath + '/doodads.json', "[]");
        fs.writeFileSync(projectPath + '/terrain.json', "{}");
        fs.writeFileSync(projectPath + '/strings.json', "{}");
        
        console.log("Project created!");
        return projectPath; // where was the project created?
    },
    
    loadMap: function(projectDir) {
        var fs = require('fs-extra'),
            projectManifest = require(Path.resolve(projectDir + '/project.json'));
        
        // Clear the global map when we are loading a new one
        map = { // the map we are currently editing
            units:   require(Path.resolve(projectDir + '/units.json')),
            doodads: require(Path.resolve(projectDir + '/doodads.json')),
            terrain: require(Path.resolve(projectDir + '/terrain.json')),
            strings: require(Path.resolve(projectDir + '/strings.json'))
        };
        
        Object.keys(projectManifest).forEach((key) => {
            map[key] = projectManifest[key]; // Set the map key to the manifest value
        });
        
        console.log("Loading project: " + map.name);
        console.log(" @ " + projectDir);
        
        return map; // in case the calling function wants the instance right away
    },

    saveMap: function(projectDir) {
        // Takes the global map object and dumps it into its separate project files
        var fs = require('fs-extra'),
            projectPath = Path.resolve(projectDir);
        
        fs.writeJsonSync(projectPath +   '/units.json', map.units);
        fs.writeJsonSync(projectPath + '/doodads.json', map.doodads);
        fs.writeJsonSync(projectPath + '/terrain.json', map.terrain);
        fs.writeJsonSync(projectPath + '/strings.json', map.strings);
        
        console.log("Saved map " + map.name);
        console.log(" @ " + projectPath);
    },
    
    translateMap: function(mapObj) {
        var UnitsTranslator = require('./UnitsTranslator'),
            DoodadsTranslator = require('./DoodadsTranslator'),
            TerrainTranslator = require('./TerrainTranslator'),
            StringsTranslator = require('./StringsTranslator'),
            
            // instances of translators
            unitsTranslator = new UnitsTranslator('war3mapUnits.doo', mapObj.units),
            doodadsTranslator = new DoodadsTranslator('war3map.doo', mapObj.doodads),
            terrainTranslator = new TerrainTranslator('war3map.w3e', mapObj.terrain),
            stringsTranslator = new StringsTranslator('war3map.wts', mapObj.strings);
        
        unitsTranslator.write(); // war3mapUnits.doo
        doodadsTranslator.write(); // war3map.doo
        terrainTranslator.write(); // war3map.w3e
        stringsTranslator.write(); // war3map.wts
    }
}

module.exports = Map;