const
    {app} = require('electron'),
    fs = require('fs-extra'),
    Path = require('path'),
    klaw = require('klaw-sync');

var PluginManager = {
    loadedPlugins: {},

    LoadPlugins: function(mod, appEvents) {
        const appPath = Path.join(app.getPath('documents'), 'icesickle', 'plugins');
        var pluginFolders = fs.readdirSync( appPath )
        console.log('Loading ' + pluginFolders.length + ' plugins from ' + appPath)

        pluginFolders.forEach((pluginFolder) => {
            var pluginPath = Path.join(appPath, pluginFolder),
                stat = fs.statSync(pluginPath);

            if(stat && stat.isDirectory()) {
                loadPlugin(pluginPath, mod, appEvents);
            }
        });
    }
}

function loadPlugin(dir, mod) {
    const pluginManifestPath = Path.resolve(dir, 'package.json');

    // Register the plugin
    var pluginManifest = fs.readJsonSync(pluginManifestPath),
        PluginClass = new require('./Plugin.js')(pluginManifest.name);

    PluginManager.loadedPlugins[pluginManifest.name] = {
        manifest: pluginManifest,
        module: mod.require(dir)(PluginClass)
    };

    // Execute the plugin's initial script
    PluginManager.loadedPlugins[pluginManifest.name].module.onLoad();
    console.log('Plugin:', pluginManifest.name, 'loaded');
}

module.exports = PluginManager;
