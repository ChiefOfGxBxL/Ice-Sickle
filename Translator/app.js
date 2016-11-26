var fs = require('fs'),
    units = JSON.parse(fs.readFileSync('sample data\\units.json', 'utf8')),
    doodads = JSON.parse(fs.readFileSync('sample data\\doodads.json', 'utf8')),
    terrain = JSON.parse(fs.readFileSync('sample data\\terrain.json', 'utf8')),
    strings = JSON.parse(fs.readFileSync('sample data\\strings.json', 'utf8')),
    
    // translators
    UnitsTranslator = require('./translators/UnitsTranslator'),
    DoodadsTranslator = require('./translators/DoodadsTranslator'),
    TerrainTranslator = require('./translators/TerrainTranslator'),
    StringsTranslator = require('./translators/StringsTranslator'),
    
    // instances of translators
    unitsTranslator = new UnitsTranslator('war3mapUnits.doo', units),
    doodadsTranslator = new DoodadsTranslator('war3map.doo', doodads),
    terrainTranslator = new TerrainTranslator('war3map.w3e', terrain),
    stringsTranslator = new StringsTranslator('war3map.wts', strings);
    
unitsTranslator.write();
doodadsTranslator.write();
terrainTranslator.write();
stringsTranslator.write();
