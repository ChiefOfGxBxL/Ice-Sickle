const
    {app} = require('electron'),
    fs = require('fs-extra'),
    Path = require('path'),
    klaw = require('klaw-sync');

var PluginManager = {
    loadedPlugins: {},

    LoadPlugins: function(mod, appEvents) {
        var pluginFolders = klaw(
            Path.resolve(app.getAppPath() + '/plugins'),
            { nofile: true }
        );

        pluginFolders.forEach((pluginFolder) => {
            loadPlugin(pluginFolder.path, mod, appEvents);
        });
    },

    Broadcast: function(eventName, eventData) {
        Object.values(this.loadedPlugins).forEach((plugin) => {
            if(plugin.module.events[eventName]) {
                plugin.module.events[eventName](eventName, eventData);
            }
        })
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
    PluginManager.loadedPlugins[pluginManifest.name].module.init();
}

module.exports = PluginManager;
