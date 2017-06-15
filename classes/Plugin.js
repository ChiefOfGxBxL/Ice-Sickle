var Path = require('path'),
    fs = require('fs-extra'),
    {app} = require('electron');

module.exports = function(pluginName) {
    const pluginPath = Path.resolve('plugins', pluginName);

    return {
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
                app.Events['register-window'](null, manifest);
            }
        },
        settings: {
            setGlobal: function(name, data) {
                app.Events['set-global-setting'](null, {
                    name: name,
                    data: data
                });
            },
            setLocal: function(name, data) {
                app.Events['set-local-setting'](null, {
                    plugin: pluginName,
                    name: name,
                    data: data
                });
            }
        }
    };
}
