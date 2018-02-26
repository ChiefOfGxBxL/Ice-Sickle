var Path = require('path'),
    fs = require('fs-extra'),
    {app} = require('electron'),
    isDev = require('electron-is-dev');

const appPath = app.getPath('userData');
const appDataPath = Path.join(app.getPath('documents'), 'icesickle');

module.exports = function(pluginName) {
    const pluginPath = Path.join(appDataPath, 'plugins', pluginName);

    const pluginLogFn = (type, msg) => {
        plugin.event.send('log', {
            type: type,
            msg: msg
        });
    };

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
            register: function(windowManifest) {
                if(typeof windowManifest === 'string') {
                    windowManifest = fs.readJsonSync(Path.resolve(pluginPath, windowManifest));
                }

                // Now we have that manifest is a JSON object
                windowManifest.path = Path.resolve(pluginPath, windowManifest.path);
                app.Events['registerWindow'](null, windowManifest);
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
        enums: {},
        log: pluginLogFn
    };

    //Load all enums in the ./enum directory and set plugin.enums
    const enumFolderPath = isDev ?
        Path.join(app.getAppPath(), 'enum') :
        Path.join(appPath, 'enum');

    const enumFiles = fs.readdirSync(enumFolderPath);
    enumFiles.forEach((enumFile) => {
        const enumFileNameWithoutExt = enumFile.split('.js')[0];

        plugin.enums[enumFileNameWithoutExt] = require(
            Path.join(enumFolderPath, enumFile)
        );
    });

    return plugin
}
