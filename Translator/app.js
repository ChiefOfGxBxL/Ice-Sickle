var fs = require('fs'),
    doodads = JSON.parse(fs.readFileSync('L:\\Users\\Greg\\Desktop\\doodads.json', 'utf8')),
    terrain = JSON.parse(fs.readFileSync('L:\\Users\\Greg\\Desktop\\terrain.json', 'utf8')),
    strings = JSON.parse(fs.readFileSync('L:\\Users\\Greg\\Desktop\\strings.json', 'utf8')),
    
    // translators
    DoodadsTranslator = require('./translators/DoodadsTranslator'),
    TerrainTranslator = require('./translators/TerrainTranslator'),
    StringsTranslator = require('./translators/StringsTranslator'),
    
    // instances of translators
    doodadsTranslator = new DoodadsTranslator('war3map.doo', doodads),
    terrainTranslator = new TerrainTranslator('war3map.w3e', terrain),
    stringsTranslator = new StringsTranslator('war3map.wts', strings);
    
doodadsTranslator.write();
terrainTranslator.write();
stringsTranslator.write();

