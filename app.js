const {app, BrowserWindow, Menu, dialog, ipcMain, protocol} = require('electron'),
    autoUpdater = require("electron-updater").autoUpdater,
    isDev = require('electron-is-dev'),
    path = require('path'),
    url = require('url'),
    fs = require('fs-extra'),
    Handlebars = require('handlebars');

var Map = require('./classes/Map'),
    Window = require('./classes/Window'),
    Settings = require('./classes/Settings');

var mapObj; // Store Map in this object

// Global variables across windows
global.globals = {
    AppName: 'Ice-Sickle',
    AppPath: app.getAppPath(),
    isDevelopment: isDev
};

function OpenProjectWindow() {
    dialog.showOpenDialog({
        title: 'Open project',
        defaultPath: app.getAppPath(),
        properties: ['openDirectory']
    }, function(projects) {
        if(projects) {
            // Load and store the Map here in the app
            EventHandlers['load-project'](null, projects[0]);
        }
    });
}

function LoadProject(projectPath) {
    if(mapObj = Map.Load(projectPath)) {
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
            Window.Open('newProject');
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
            EventHandlers['request-save-project']();
        }
      },
      { type: 'separator' },
      /* Recent maps are generated here */
    ]
  },
  {
      label: 'Edit',
      submenu: [
          {
              label: 'Undo',
              enabled: false
          },
          {
              label: 'Redo',
              enabled: false
          },
          { type: 'separator' },
          {
              label: 'Cut',
              enabled: false
          },
          {
              label: 'Copy',
              enabled: false
          },
          {
              label: 'Paste',
              enabled: false
          },
          {
              label: 'Delete',
              enabled: false
          },
      ]
  },
  {
      label: 'View',
      enabled: false
  },
  {
      label: 'Scenario',
      submenu: [
          {
              label: 'Map Properties',
              click() {
                  Window.Open('mapProperties', mapObj.info);
              }
          }
      ]
  },
  {
      label: 'Editors',
      submenu: [
          {
              label: 'Trigger Editor',
              sublabel: '',
              click() {
                  Window.Open('triggerEditor');
              }
          },
          {
              label: 'Object Editor',
              sublabel: '',
              click() {
                  Window.Open('objectEditor');
              }
          },
          { type: 'separator' },
          {
              label: 'Import Manager',
              sublabel: '',
              click() {
                  Window.Open('importManager');
              }
          }
      ]
  },
  {
      label: 'Project',
      submenu: [
          {
              label: 'Compile',
              sublabel: 'Generates the .w3x file',
              click () {
                  EventHandlers['request-compile-project']();
              }
          }
      ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'GitHub',
        sublabel: 'View the application\'s source code',
        //icon: 'assets/img/github.png',
        click () { require('electron').shell.openExternal('https://github.com/ChiefOfGxBxL/Ice-Sickle') }
      },
      {
          label: 'Debug',
          submenu: [
              {
                  label: 'Open web console',
                  role: 'toggledevtools'
              },
              {
                  label: 'Reload window',
                  role: 'reload'
              }
          ]
      },
      { type: 'separator' },
      {
        label: 'About',
        click () {
            Window.Open('about', {
                appName: app.getName(),
                appVersion: app.getVersion()
            });
        }
      }
    ]
  }
];

Settings.Load(app.getAppPath());
if(Settings.recentMaps) {
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
}

var counter = 0;
function getNextIdCounter(type) {
    // TODO: respond based on data.type
    return ('0000' + (counter++)).substr(-4);
}

function applyPartialObjectUpdate(obj, updates) {
  Object.keys(updates).forEach((updateKey) => {
    if(typeof updates[updateKey] != 'object') {
      obj[updateKey] = updates[updateKey];
    }
    else {
      obj[updateKey] = obj[updateKey] || {};
      applyPartialObjectUpdate(obj[updateKey], updates[updateKey])
    }
  })
}

const EventHandlers = {
    'create-new-project': function(event, data) {
        mapObj = Map.Create(data.name);
        Window.Broadcast('project-created', mapObj);
        Window.Close('welcome'); // In case this window is still open, close it
    },
    'request-open-project': function() {
        OpenProjectWindow();
    },
    'request-save-project': function() {
        Map.Save(mapObj);
        Window.Broadcast('project-saved', mapObj);
    },
    'request-compile-project': function() {
        // TODO: note that map compilation is not yet implemented
        Map.Compile(mapObj);
    },
    'request-open-project-map': function(event, dir) {
        mapObj = Map.Load(dir);
    },
    'load-project': function(event, path) {
        if(LoadProject(path)) {
            Window.Broadcast('project-loaded', mapObj);

            // Store the project in recently-loaded settings
            if(Settings.recentMaps.indexOf(path) === -1) {
                Settings.recentMaps.push(path);
                Settings.Save();
            }
        }
    },
    'request-project': function(event, data) {
        // Send the Map back to the requesting window
        event.sender.webContents.send('response-project', mapObj);
    },
    'request-user-input': function(event, data) {
        var inputWindowName = 'input' + data.type[0].toUpperCase() + data.type.substr(1); // e.g. inputInt

        if(Window.availableWindows[inputWindowName]) {
            Window.Open(inputWindowName, data.context);
        }
        else {
            Window.Open('inputUnknown', data.context);
        }
    },
    'response-user-input': function(event, data) {
        Window.Broadcast('user-input-provided', data);
    },
    'patch-project-object': function(event, data) {
        // TODO: clean this mess up
        mapObj.objects[data.specType] = mapObj.objects[data.specType] || {};
        mapObj.objects[data.specType][data.table] = mapObj.objects[data.specType][data.table] || {};
        mapObj.objects[data.specType][data.table][data.entryId] = mapObj.objects[data.specType][data.table][data.entryId] || [];

        // Check if a modification already exists, in which case overwrite its value
        // TODO: this section is messy because of the poor WC3MapTranslator spec -- update it to use the object format
        var existingModificationIndex = mapObj.objects[data.specType][data.table][data.entryId].findIndex((mod) => {
            return mod.id === data.modification.id;
        });

        if(existingModificationIndex !== -1) {
            mapObj.objects[data.specType][data.table][data.entryId][existingModificationIndex].value = data.modification.value;
        }
        else {
            mapObj.objects[data.specType][data.table][data.entryId].push(data.modification);
        }
    },
    'request-open-window': function(event, data) {
        if(!data || !data.windowName) return false;

        Window.Open(data.windowName, data.template);
    },
    'new-custom-object': function(event, data) {
        // Add new object to mapObj, with custom name specified
        var mapObjName = data.type + 's'; // e.g. units, doodads, etc.
        mapObj.objects[mapObjName].custom[data.id] = [{
            id: 'unam', // TODO: unam, inam, etc.
            type: 'string',
            value: data.name
        }];

        // Send event to all windows
        Window.Broadcast('new-custom-object', data);
    },
    'request-id-counter': function(event, data) {
        event.sender.webContents.send('response-id-counter', getNextIdCounter(data.type));
    },
    'request-triggers': function(event, data) {
        event.sender.webContents.send('response-triggers', mapObj.triggers);
    },
    'update-trigger': function(event, data) {
        // Update a specified trigger's contents
        var triggerToUpdate = mapObj.triggers.find((t) => {
          return t.name === data.name;
        });

        if(triggerToUpdate) {
          triggerToUpdate.content = data.content;
        }
    },
    'new-trigger': function(event, data) {
        // TODO: check for conflicting trigger paths
        var newTriggerFilePath = path.resolve(mapObj.__Dir, 'triggers/', (data.name + '.' + data.type)),
            newTrigger = {
                name: data.name,
                path: newTriggerFilePath,
                type: data.type,
                content: ''
            };

        // Create a new file in the project
        fs.ensureFileSync(newTriggerFilePath);

        // Create a new trigger in the map
        mapObj.triggers.push(newTrigger)

        Window.Broadcast('new-trigger', newTrigger);
    },
    'update-map-info': function(event, newInfo) {
        // Applies a recursive, partial update to mapObj.info
        applyPartialObjectUpdate(mapObj.info, newInfo);
    },
    'request-import-list': function(event, data) {
        event.sender.webContents.send('response-import-list', mapObj.imports);
    },
    'import-file': function(event, file) {
        // First we copy the file into the project's /import folder
        const destinationPath = path.resolve(mapObj.__Dir, 'imports', file.name);
        fs.copySync(file.path, destinationPath, { overwrite: true });
        // TODO: alert user of path conflict, giving the option to overwrite

        // Then we add a record to the map object
        mapObj.imports.push({
            name: file.name,
            fullPath: 'war3mapImported\\' + file.name,
            path: file.path,
            size: file.size,
            type: file.type
        });
    },
    'update-import': function(event, file) {
        var importToUpdate = mapObj.imports.find(
            (imp) => { return imp.name == file.name; }
        );

        if(importToUpdate) {
            // This is the only attribute that can be changed
            // since size, name, and type are not modified by user
            if(file.fullPath) importToUpdate.fullPath = file.fullPath;
            Window.Broadcast('import-updated', importToUpdate);
        }
    }
}

// FUTURE:
// We can use app.addRecentDocument(path) and app.setUserTasks(tasks) in the future
// for enhanced Taskbar utility. See the `app` documentation for more details

// Auto-Updates
autoUpdater.on('checking-for-update',   () => { Window.Broadcast('checking-for-update'); })
autoUpdater.on('update-available',      (ev, info) => {
    // Open check-for-updates window
    Window.Open('update');

    Window.Broadcast('update-available', info);
})
autoUpdater.on('update-not-available',  (ev, info) => { Window.Broadcast('update-not-available', info); })
autoUpdater.on('error',                 (ev, err) => { Window.Broadcast('update-error', err); })
autoUpdater.on('download-progress',     (ev, progressObj) => { Window.Broadcast('download-progress', progressObj ); })
autoUpdater.on('update-downloaded',     (ev, info) => {
  Window.Broadcast('update-downloaded', info);

   // Wait 4 seconds, then quit and install
  setTimeout(function() {
    autoUpdater.quitAndInstall();
  }, 4000)
})



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if(isDev) {
        autoUpdater.logger = require("electron-log")
        autoUpdater.logger.transports.file.level = "info"
    }
    //autoUpdater.checkForUpdates(); // Use the autoUpdater from electron-updater
    app.setName('Ice Sickle'); // From package.json it's icesickle (since npm init required lowercase, no spaces)

    // Create main window
    Window.Open('root');

    // Register IPC events
    Object.keys(EventHandlers).forEach((eventKey) => {
        ipcMain.on(eventKey, EventHandlers[eventKey]);
    });

    // Create the main menu from the template
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    // Open welcome dialog
    Window.Open('welcome', {
        recent: (Settings.recentMaps) ? Settings.recentMaps.map((dir) => {
            return {
                name: dir.split('\\').reverse()[0],
                path: dir.replace(/\\/g, "\\\\")
            }
        }) : []
    })

    // The hbs:// protocol is used to render handlebars files
    // See http://stackoverflow.com/a/41368514 for more details
    protocol.registerBufferProtocol('hbs', function (req, callback) {
        // The JSON context is passed through as uploaded POST data
        var context = (req.uploadData && req.uploadData[0]) ? JSON.parse(req.uploadData[0].bytes) : {},
            pathToFile = req.url.substr(7); // get rid of "hbs:///"

        // Sometimes the path is incorrect even now, but the file still exists
        // We check to see if the path can be salvaged: combine the app path
        // with the specified path without drive letter in front
        if(!fs.existsSync(pathToFile)) {
            if(fs.existsSync(path.resolve(app.getAppPath(), pathToFile.substr(3)))) {
                pathToFile = path.resolve(app.getAppPath(), pathToFile.substr(3));
            }
        }

        // If the file does not exist now then we cannot load it
        if(fs.existsSync(pathToFile)) {
          if(req.url.endsWith('.html') || req.url.endsWith('.hbs')) {
            // Use Handlebars to compile the template and render the context
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
            // Otherwise read the file normally and pass it through
            fs.readFile(pathToFile, 'utf8', function(err, data) {
              callback({
                  //mimeType: 'text/css',
                  data: new Buffer(data)
              });
            });
          }
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
    if (!Window.openWindows.root) {
        Window.Open('root');
    }
})
