var Path = require('path'),
    {app} = require('electron');

module.exports = {
    require: (name) => {
        return require(Path.resolve('./', name));
    },
    event: {
        on: function(eventName, fn) {
            console.log('plugin wants to register for event', eventName);
            //app.ipcMain.on(eventName, fn);
            app.pluginSystem.listeners[eventName] = app.pluginSystem.listeners[eventName] || [];
            app.pluginSystem.listeners[eventName].push(fn);
        },
        send: (eventName, eventData) => {
            console.log('plugin is sending app the following event', eventName, eventData);

            if(app.Events[eventName]) {
                app.Events[eventName](eventName, eventData);
            }
        }
    }
};
