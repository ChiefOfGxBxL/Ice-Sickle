const
    {app} = require('electron'),
    fs = require('fs-extra'),
    Path = require('path'),
    klaw = require('klaw-sync');

var PluginManager = {
    loadedPlugins: {},

    LoadPlugins: function(mod, appEvents) {
        var pluginFolders = fs.readdirSync( Path.resolve(app.getAppPath() + '/plugins') )

        pluginFolders.forEach((pluginFolder) => {
            var pluginPath = Path.resolve('plugins', pluginFolder);

            if(fs.statSync(pluginPath).isDirectory()) {
                loadPlugin(pluginPath, mod, appEvents);
            }
        });
    }
}

function loadPlugin(dir, mod) {
    const pluginManifestPath = Path.resolve(dir, 'package.json');

    // Register the plugin
    var pluginManifest = fs.readJsonSync(pluginManifestPath);
    PluginManager.loadedPlugins[pluginManifest.name] = {
        manifest: pluginManifest,
        module: mod.require(dir)
    };

    // Execute the plugin's initial script
    PluginManager.loadedPlugins[pluginManifest.name].module()
}

module.exports = PluginManager;
