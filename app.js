const {app, BrowserWindow, Menu, dialog, ipcMain, protocol} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs-extra')
const Handlebars = require('handlebars');

// Automatically reloads view if source is changed
// require('electron-reload')(__dirname);

// Store Map in app
var Map = require('./classes/Map');

// Initialize global settings
var Settings = require('./classes/Settings');
Settings.Load(app.getAppPath());

// Global variables across windows
global.globals = {
    AppName: 'Ice-Sickle'
};

// Stores references to all open windows; key = file name (e.g. index.html)
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = {}; // Always contains 'root'

function OpenNewWindow(view, options) {
    var viewPath = path.join(__dirname, '/views/' + view);

    // If the requested view does not exist, exit
    if(!fs.existsSync(viewPath)) {
        console.log('Error opening new window: could not find view', viewPath);
        return false;
    }

    // If the window is already open and multiple are not allowed,
    // do not open another window
    if(!options.allowMultiple && windows[view]) {
        windows[view].focus(); // Bring the opened window to front-view
        return false;
    }

    const isHandlebars =
        view.endsWith('.hbs') ||
        view.endsWith('.handlebars') ||
        options.template; // if we provide a template to an HTML file

    // Set preload on all windows to run the global-script
    // so globals are available to every window via `globals` variable
    options.webPreferences = {
        preload: path.join(__dirname, 'preload.js')
    };

    var newWindow = new BrowserWindow(options); // Create a new window
    windows[view] = newWindow; // Register the new window

    // Load the window with the specified view
    var addlData = {};
    if(isHandlebars) {
        addlData = {
            // Encode handlebars template in post data
            postData: [{
                type: 'rawData',
                bytes: Buffer.from(JSON.stringify(options.template))
            }],
            extraHeaders: 'Content-Type: application/x-www-form-urlencoded'
        };
    }

    newWindow.loadURL(
        url.format({
            pathname: viewPath,
            protocol: (isHandlebars) ? 'hbs:' : 'file:',
            slashes: true
        }),
        addlData
    );

    newWindow.webContents.openDevTools();

    // Iterate over events and add a new one to the window for each
    if(options.events) {
        Object.keys(options.events).forEach((event) => {
            newWindow.on(event, () => {
                options.events[event]();
            });
        });
    }

    // We always handle the closed event
    newWindow.on('closed', () => {
        delete windows[view];
    });
}

function CreateNewProjectWindow() {
    OpenNewWindow('new-project.html', {
        width: 320, height: 540,
        parent: windows.root, modal: true,
        frame: false
    });
}

function OpenProjectWindow() {
    dialog.showOpenDialog({
        title: 'Open project',
        defaultPath: app.getAppPath(),
        properties: ['openDirectory']
    }, function(projects) {
        // should only be one project selected
        if(projects) {
            // Load and store the Map here in the app
            if(Map.Load(projects[0])) { // Map loaded successfully
                // Tell any renderer processes that a map load request has been initiated
                windows.root.webContents.send('open-project', projects[0]);
                BroadcastEvent('project-loaded', Map);

                // Store the project in recently-loaded settings
                if(Settings.recentMaps.indexOf(projects[0]) === -1) {
                    Settings.recentMaps.push(projects[0]);
                    Settings.Save();
                }

                return true;
            }
            else {
                return false;
            }
        }

        return false;
    });
}

function LoadProject(projectPath) {
    if(Map.Load(projectPath)) {
        windows.root.webContents.send('open-project', projectPath);
        return true;
    }
    else {
        return false;
    }
}

var template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New',
        sublabel: 'Create a new project',
        role: 'new',
        click () {
            CreateNewProjectWindow();
        }
      },
      {
        label: 'Open',
        sublabel: 'Open a project',
        role: 'open',
        click () {
            OpenProjectWindow();
        },
      },
      {
        label: 'Save',
        sublabel: 'Saves the current project',
        role: 'save',
        click () {
            windows.root.webContents.send('save-project');
        }
      },
      {
        type: 'separator'
      },
      /* Recent maps are generated here */
    ]
  },
  {
      label: 'Project',
      submenu: [
          {
              label: 'Compile',
              sublabel: 'Generates the .w3x file',
              role: 'new',
              click () {
                  windows.root.webContents.send('compile-project');
              }
          },
          {
              type: 'separator'
          },
          {
              label: 'Object Editor',
              sublabel: '',
              click() {
                  OpenNewWindow('object-editor.html', {
                      width: 1000, height: 600
                  });
              }
          }
      ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('http://electron.atom.io') }
      },
      {
        label: 'About',
        click () {
            var aboutWin = new BrowserWindow({
                width: 300,
                height: 200,
                parent: windows.root,
                modal: true,
                frame: false
            });

            aboutWin.loadURL(url.format({
              pathname: path.join(__dirname, '/views/about.html'),
              protocol: 'file:',
              slashes: true
            }));

            aboutWin.on('closed', () => {
              aboutWin = null
            })
        }
      }
    ]
  },
  {
    label: 'Debug',
    role: 'Debug',
    submenu: [
        {
            label: 'Open web console',
            click (e) { windows.root.webContents.openDevTools(); }
        }
    ]
  }
];

Settings.recentMaps.forEach((recentMap) => {
    var mapName = recentMap.split('\\').reverse()[0];

    template[0].submenu.push({
        label: mapName,
        sublabel: recentMap,
        click(entry) {
            LoadProject(entry.sublabel);
        }
    });
})

const EventHandlers = {
    'create-new-project': function(event, data) {
        console.log(data);
        windows.root.webContents.send('create-new-project', data);
    },
    'request-new-project': function() {
        CreateNewProjectWindow();
    },
    'request-open-project': function() {
        OpenProjectWindow();
    },
    'load-project': function(event, data) {
        console.log(data);
        if(LoadProject(data.path)) {
            BroadcastEvent('project-loaded', Map);
        }
    },
    'request-project': function(event, data) {
        // Send the Map back to the requesting window
        event.sender.webContents.send('response-project', Map);
    },
    'request-user-input': function(event, data) {
        var inputViewPath = 'input/' + data.type + '.html';
        if(!fs.existsSync(path.resolve('./views/' + inputViewPath))) {
            inputViewPath = 'input/unknown.html';
        }

        OpenNewWindow(inputViewPath, {
            parent: windows['object-editor.html'] || windows.root, // TODO: correct window based on event
            modal: true,
            frame: false,
            width: 400,
            height: 300,
            template: data.context
        });
    },
    'response-user-input': function(event, data) {
        BroadcastEvent('user-input-provided', data);
    }
    // 'patch-project': function(event, data) {
    //     Map[data.field] = data.data;
    //     console.log('updated map field ' + data.field);
    //     console.log(Map);
    // }
}

function BroadcastEvent(eventName, data) {
    console.log('[! Event ]', eventName);

    Object.keys(windows).forEach((window) => {
        windows[window].webContents.send(eventName, data);
    })
}

function createWindow () {
    // Create the browser window.
    windows.root = new BrowserWindow({width: 1000, height: 900});

    // Create the main menu from the template
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // and load the index.html of the app.
    windows.root.loadURL(url.format({
        pathname: path.join(__dirname, '/views/index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    windows.root.webContents.openDevTools();

    // Register IPC events
    Object.keys(EventHandlers).forEach((eventKey) => {
        ipcMain.on(eventKey, EventHandlers[eventKey]);
    });

    // Emitted when the window is closed.
    windows.root.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows.root = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    // Create main window
    createWindow();

    // Open welcome dialog
    OpenNewWindow('welcome.html', {
        parent: windows.root,
        modal: true,
        frame: false,
        width: 660,
        height: 685,
        template: {
            recent: Settings.recentMaps.map((dir) => {
                return {
                    name: dir.split('\\').reverse()[0],
                    path: dir.replace(/\\/g, "\\\\")
                }
            })
        }
    });

    // The hbs:// protocol is used to render handlebars files
    // See http://stackoverflow.com/a/41368514 for more details
    protocol.registerBufferProtocol('hbs', function (req, callback) {
        // The JSON context is passed through as uploaded POST data
        var context = (req.uploadData && req.uploadData[0]) ? JSON.parse(req.uploadData[0].bytes) : {},
            pathToFile = req.url.substr(7);

        if(fs.existsSync(pathToFile)) {
            fs.readFile(pathToFile, 'utf8', function(err, data) {
                var template = Handlebars.compile(data),
                    page = template(context);

                callback({
                    mimeType: 'text/html',
                    data: new Buffer(page)
                });
            });
        }
        else {
            // Try the corresponding file under the file:/// protocol
            pathToFile = path.resolve(__dirname, pathToFile.substr(3));
            fs.readFile(pathToFile, 'utf8', function(err, data) {
                //console.log(err, data);
                callback({
                    //mimeType: 'text/css',
                    data: new Buffer(data)
                });
            });
        }
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // Save any unsaved changes to settings
    Settings.Save();

    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// MacOS dock support
app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.root === null) {
        createWindow()
    }
})
