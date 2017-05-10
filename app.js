const {app, BrowserWindow, Menu, dialog, ipcMain, protocol} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
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
let windows = {
    //root:
};

function OpenNewWindow(view, options) {
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
            pathname: path.join(__dirname, '/views/' + view),
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
        windows[view] = null;
    });
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
            OpenNewWindow('new-project.html', {
                width: 320, height: 540,
                parent: windows.root, modal: true,
                frame: false
            });
        }
      },
      {
        label: 'Open',
        sublabel: 'Open a project',
        role: 'open',
        click () {
            dialog.showOpenDialog({
                title: 'Open project',
                defaultPath: app.getAppPath(),
                properties: ['openDirectory']
            }, function(projects) {
                // should only be one project selected
                if(projects) {
                    // Load and store the Map here in the app
                    Map.Load(projects[0]);

                    // Tell any renderer processes that a map load request has been initiated
                    windows.root.webContents.send('open-project', projects[0]);

                    // Store the project in recently-loaded settings
                    if(Settings.recentMaps.indexOf(projects[0]) === -1) {
                        Settings.recentMaps.push(projects[0]);
                        Settings.Save();
                    }
                }
            });
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
  }
];

Settings.recentMaps.forEach((recentMap) => {
    var mapName = recentMap.split('\\').reverse()[0];

    template[0].submenu.push({
        label: mapName,
        sublabel: recentMap,
        click(entry) {
            Map.Load(entry.sublabel);
            windows.root.webContents.send('open-project', entry.sublabel);
        }
    });
})

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

    // Received message from new-project menu
    ipcMain.on('create-new-project', (event, data) => {
        console.log(data);
        windows.root.webContents.send('create-new-project', data);
    });

    ipcMain.on('request-project', (event, data) => {
        event.sender.webContents.send('response-project', Map);
    });

    // ipcMain.on('patch-project', (event, data) => {
    //     Map[data.field] = data.data;
    //     console.log('updated map field ' + data.field);
    //     console.log(Map);
    // });

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
    createWindow();

    // The hbs:// protocol is used to render handlebars files
    // See http://stackoverflow.com/a/41368514 for more details
    protocol.registerBufferProtocol('hbs', function (req, callback) {
        // The JSON context is passed through as uploaded POST data
        var context = (req.uploadData && req.uploadData[0]) ? JSON.parse(req.uploadData[0].bytes) : {},
            pathToFile = req.url.substr(7);

        fs.readFile(pathToFile, 'utf8', function(err, data) {
            var template = Handlebars.compile(data),
                page = template(context);

            callback({
                mimeType: 'text/html',
                data: new Buffer(page)
            });
        });
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

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.root === null) {
        createWindow()
    }
})
