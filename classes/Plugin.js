var Path = require('path'),
    fs = require('fs-extra'),
    {app} = require('electron');

module.exports = function(pluginName) {
    const pluginPath = Path.resolve('plugins', pluginName);

    var plugin = {
        require: (name) => {
            return require(Path.resolve('./', name));
        },
        event: {
            on: function(eventName, fn) {
                app.pluginSystem.listeners[eventName] = app.pluginSystem.listeners[eventName] || [];
                app.pluginSystem.listeners[eventName].push(fn);
            },
            send: (eventName, eventData) => {
                if(app.Events[eventName]) {
                    app.Events[eventName](eventName, eventData);
                }
            }
        },
        window: {
            register: function(manifest) {
                if(typeof manifest === 'string') {
                    manifest = fs.readJsonSync(Path.resolve(pluginPath, manifest));
                }

                // Now we have that manifest is a JSON object
                manifest.path = Path.resolve(pluginPath, manifest.path);
                app.Events['registerWindow'](null, manifest);
            }
        },
        settings: {
            setGlobal: function(name, data) {
                app.Events['setGlobalSetting'](null, {
                    name: name,
                    data: data
                });
            },
            setLocal: function(name, data) {
                app.Events['setLocalSetting'](null, {
                    plugin: pluginName,
                    name: name,
                    data: data
                });
            }
        },
        enums: {}
    };

    // Load all enums in the ./enum directory and set plugin.enums
    const enumFiles = fs.readdirSync( './enum' );
    enumFiles.forEach((enumFile) => {
        const enumFileNameWithoutExt = enumFile.split('.js')[0];

        plugin.enums[enumFileNameWithoutExt] = require(
            Path.join(app.getAppPath(), 'enum', enumFile)
        );
    });

    return plugin
}
