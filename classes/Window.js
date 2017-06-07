const
    fs = require('fs-extra'),
    Path = require('path'),
    Url = require('url'),
    {BrowserWindow} = require('electron');

var Window = {
    openWindows: {}, // Keeps track of all open BrowserWindow's
    availableWindows: {}, // Stores all available windows to work with as JSON

    Open: function(windowName, template, events) {
        var window = Window.availableWindows[windowName];
        if(!window) return false; // A window by the specified name does not exist

        // The window.path is relative to the /views directory, but we are not
        var viewPath = Path.join(__dirname, '..', 'views', window.path);

        // If the requested view does not exist, exit
        if(!fs.existsSync(viewPath)) {
            console.error('Error opening new window: could not find view', viewPath);
            return false;
        }

        // If the window is already open and multiple are not allowed,
        // do not open another window
        if(!window.allowMultiple && Window.openWindows[windowName]) {
            Window.openWindows[windowName].focus(); // Bring the opened window to front-view
            return false;
        }

        // Indicate if this view uses Handlebars
        const isHandlebars =
            window.path.endsWith('.hbs') ||
            window.path.endsWith('.handlebars') ||
            window.requiresTemplate || // window specifies it needs a template
            template; // if we provide a template to an HTML file

        // Otherwise we create a new window
        var windowOptions = window;
        if(windowOptions.parent) {
            windowOptions.parent = Window.openWindows[windowOptions.parent];
        }
        windowOptions.webPreferences = {
            // Set preload on all windows to run the global-script
            // so globals are available to every window via `globals` variable
            preload: Path.join(__dirname, '../preload.js')
        }

        var newWindow = new BrowserWindow(windowOptions); // Create a new window
        Window.openWindows[windowName] = newWindow; // Register the new window

        // Encode any template data in the POST body
        var addlData = {};
        if(isHandlebars && template) {
            addlData = {
                // Encode handlebars template in post data
                postData: [{
                    type: 'rawData',
                    bytes: Buffer.from(JSON.stringify(template))
                }],
                extraHeaders: 'Content-Type: application/x-www-form-urlencoded'
            };
        }

        // Load the window with the specified view
        newWindow.loadURL(
            Url.format({
                pathname: viewPath,
                protocol: (isHandlebars) ? 'hbs:' : 'file:',
                slashes: true
            }),
            addlData
        );

        // Iterate over events and add a new one to the window for each
        if(events) {
            Object.keys(events).forEach((event) => {
                newWindow.on(event, () => {
                    events[event]();
                });
            });
        }

        // We always handle the closed event
        newWindow.on('closed', () => {
            delete Window.openWindows[windowName];
        });
    },

    Close: function(windowName) {
        if(Window.openWindows[windowName]) {
            Window.openWindows[windowName].close();
        }
    },

    SendMessage: function(windowName, eventName, data) {
        if(Window.openWindows[windowName]) {
            Window.openWindows[windowName].webContents.send(eventName, data);
        }
    },

    Broadcast: function(eventName, data) {
        console.log('[ Event ]', eventName);

        Object.keys(Window.openWindows).forEach((window) => {
            Window.openWindows[window].webContents.send(eventName, data);
        })
    }
}

function loadDefaultInputWindows() {
    var inputTypes = ['int', 'singleChoice', 'unknown'];

    inputTypes.forEach((type) => {
        var inputName = 'input' + (type[0].toUpperCase()) + type.substr(1);
        Window.availableWindows[inputName] = {
            "name": inputName,
            "path": "/input/" + type + ".html",
            "description": "",
            "width": 400,
            "height": 300,
            "parent": "objectEditor",
            "modal": true,
            "frame": false,
            "allowMultiple": false,
            "requiresTemplate": true
        };
    })
}

function loadWindowsFromDir() {
    var windowsPath = Path.resolve(__dirname, '..', 'windows'),
        windowManifests = fs.readdirSync(windowsPath);

    windowManifests.forEach((manifestPath) => {
        var manifest = fs.readJsonSync(Path.resolve(windowsPath, manifestPath));
        Window.availableWindows[manifest.name] = manifest;
    });
}

loadDefaultInputWindows();
loadWindowsFromDir();
console.log('Loaded ' + Object.keys(Window.availableWindows).length + ' windows');
module.exports = Window;
