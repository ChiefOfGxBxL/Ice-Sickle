const
    {app} = require('electron'),
    fs = require('fs-extra'),
    Path = require('path'),
    klaw = require('klaw-sync'),
    https = require('https'),
    targz = require('targz'),
    cp = require('child_process');

const appPath = Path.join(app.getPath('documents'), 'icesickle', 'extensions');

var PluginManager = {
    loadedPlugins: {},

    LoadPlugins: function(mod, appEvents) {
        var pluginFolders = fs.readdirSync( appPath )
        console.log('Loading ' + pluginFolders.length + ' plugins from ' + appPath)

        pluginFolders.forEach((pluginFolder) => {
            try {
                var pluginPath = Path.join(appPath, pluginFolder),
                    stat = fs.statSync(pluginPath);

                if(stat && stat.isDirectory()) {
                    loadPlugin(pluginPath, mod, appEvents);
                }
            }
            catch(e) {
                // E.g. if fs.statSync fails above
                console.error('Error:', 'Unable to load extension', pluginFolder);
            }
        });
    },

    Install: function(name, version) {
        const tarURL = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
        const localTarDir = Path.join(appPath, name);
        const tarFile = Path.join(localTarDir, 'ext.tgz');

        // Download the tgz file locally
        const FileDownloader = require('./FileDownloader.js');
        FileDownloader.DownloadFile(tarURL, localTarDir, function(errFile, resultFile) {
            if(errFile) {}
            else {
                // Extract the tgz file
                targz.decompress({
                    src: tarFile,
                    dest: localTarDir
                }, function(err){
                    if(err) {
                        console.log(err);
                    }
                    else {
                        // The directory has a folder called 'package' that we want to hoist the files out of
                        const packageDirectory = Path.join(localTarDir, 'package');
                        fs.copySync(packageDirectory, localTarDir);
                        fs.removeSync(packageDirectory);
                        fs.removeSync(tarFile);

                        // Run npm install on the extension
                        cp.execSync('npm install', { cwd: localTarDir });

                        // Load the newly-installed extension
                        loadPlugin(localTarDir, module);
                    }
                });
            }
        });
    },

    Uninstall: function(name, cb) {
        const extensionDirPath = Path.join(appPath, name);

        // Unregister event listeners :: TODO

        // Remove from list of loaded plugins
        delete PluginManager.loadedPlugins[name];

        // Delete extension from file system
        fs.remove(extensionDirPath, function(err, result) {
            return cb(err, null);
        });
    }
}

function loadPlugin(dir, mod) {
    const pluginManifestPath = Path.resolve(dir, 'package.json');

    // Register the plugin
    try {
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
    catch(e) {
        // E.g. if package.json file is missing or index file cannot be loaded
        console.error('Error:', 'Unable to load extension', dir);
    }
}

module.exports = PluginManager;
