const {app, BrowserWindow, Menu, MenuItem, dialog, ipcMain, protocol} = require('electron'),
    autoUpdater = require("electron-updater").autoUpdater,
    isDev = require('electron-is-dev'),
    path = require('path'),
    url = require('url'),
    fs = require('fs-extra'),
    klawSync = require('klaw-sync'),
    Handlebars = require('handlebars'),
    bootstrap = require('./bootstrap/bootstrap.js')();

var Map = require('./classes/Map'),
    Window = require('./classes/Window'),
    Settings = require('./classes/Settings'),
    PluginManager = require('./classes/PluginManager'),
    mapObj; // Map data is stored in this object

var appMenu, // used to store the Menu() for the application
    log = []; // used to store log message objects (as a queue)

// Global variables across windows
global.globals = {
    AppName: 'Ice-Sickle',
    AppPath: app.getPath('userData'),
    AppDataPath: path.join(app.getPath('documents'), 'icesickle'),
    ProjectsPath: path.join(app.getPath('documents'), 'icesickle', 'projects'),
    PluginPath: path.join(app.getPath('documents'), 'icesickle', 'extensions'),
    isDevelopment: isDev
};

// Scripting languages, where the key is the extension, including .
var scriptingLanguages = {};
function loadScriptingLanguages() {
    // Each folder in ./scripting/languages houses a single scripting language
    var filterFn = function(item) {
        return item.path.indexOf('node_modules') < 0 && item.path.indexOf('.git') < 0 && item.path.split(path.sep).reverse()[1] == 'languages';
    };

    var directories = klawSync(
        path.join(global.globals.AppDataPath, 'scripting', 'languages'),
        { nofile: true, filter: filterFn, noRecurseOnFailedFilter: true }
    );

    // Load that language
    directories.forEach((langDir) => {
        try {
            var languageIndex = require(path.join(
                langDir.path,
                'index.js'
            ));

            if(languageIndex.logo) {
                languageIndex.logo = path.join(langDir.path, languageIndex.logo);
            }

            if(languageIndex.icon) {
                languageIndex.icon = path.join(langDir.path, languageIndex.icon);
            }

            languageIndex.name = langDir.path.split(path.sep).reverse()[0];

            scriptingLanguages[languageIndex.ext] = languageIndex;
            console.log('Loaded language', languageIndex.ext, languageIndex);
        }
        catch(e) {
            console.error('Error loading scripting language', langDir);
        }
    });
}

function applicationBroadcastEvent(eventName, eventData) {
    Window.Broadcast(eventName, eventData);

    // Run any function that plugins have registered to this event
    if(app.pluginSystem.listeners[eventName]) {
        app.pluginSystem.listeners[eventName].forEach((listeningFn) => {
            listeningFn(eventName, eventData);
        })
    }
}

function OpenProjectWindow() {
    dialog.showOpenDialog({
        title: 'Open project',
        defaultPath: app.getAppPath(),
        properties: ['openDirectory']
    }, function(projects) {
        if(projects) {
            // Load and store the Map here in the app
            EventHandlers['loadProject'](null, projects[0]);
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

var appMenuTemplate = [
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
            EventHandlers['saveProject']();
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
                  EventHandlers['compileProject']();
              }
          }
      ]
  },
  {
      label: 'Extensions',
      submenu: [
          { type: 'separator' },
          {
              label: 'Extension Manager',
              sublabel: 'Install, update, and remove extensions',
              click() {
                  Window.Open('extensionManager');
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
                appVersion: app.getVersion(),
                appDataPath: global.globals.AppDataPath,
                pluginPath: global.globals.PluginPath
            });
        }
      }
    ]
  }
];

Settings.Load(global.globals.AppDataPath);
if(Settings.GetGlobal('recentMaps')) {
    Settings.GetGlobal('recentMaps').forEach((recentMap) => {
        var mapName = recentMap.split('\\').reverse()[0];

        appMenuTemplate[0].submenu.push({
            label: mapName,
            sublabel: recentMap,
            click(entry) {
                EventHandlers.loadProject(null, entry.sublabel);
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
    /*
     * Application
     */
    getInstalledExtensions: function(event, data) {
        event.sender.webContents.send('installedExtensions', PluginManager.loadedPlugins);
    },

    installExtension: function(event, data) {
        PluginManager.Install(data.name, data.version, function(err, result) {
            if(err) {
                console.error(err);
            }
            else {
                applicationBroadcastEvent('extensionInstalled', result);
            }
        });
    },

    /*
     * Project
     */
    newProject: function(event, data) {
        const newProjectPath = path.join(global.globals.ProjectsPath, data.name);

        mapObj = Map.Create(newProjectPath, data.name);

        // Save the map right away to create the files
        // Trigger any project-loaded events
        Map.Save(mapObj);
        EventHandlers.loadProject(null, newProjectPath);

        applicationBroadcastEvent('projectCreated', mapObj);
        Window.Close('welcome'); // In case this window is still open, close it

        // Add new project to 'Recent projects' list
        var recentMaps = Settings.GetGlobal('recentMaps');

        recentMaps.push(newProjectPath);
        Settings.SetGlobal('recentMaps', recentMaps);
        Settings.Save();
    },
    loadProject: function(event, path) {
        if(LoadProject(path)) {
            applicationBroadcastEvent('projectLoaded', mapObj);

            // Store the project in recently-loaded settings
            var recentMaps = Settings.GetGlobal('recentMaps');

            // If a new settings.json file exists, this data will be missing
            if(!recentMaps) recentMaps = [];

            // When user opens a map not listed in recent maps, add it to the list and save
            if(recentMaps.indexOf(path) === -1) {
                recentMaps.push(path);
                Settings.SetGlobal('recentMaps', recentMaps);
                Settings.Save();
            }
        }
    },
    saveProject: function() {
        Map.Save(mapObj);
        applicationBroadcastEvent('projectSaved', mapObj);
    },
    compileProject: function() {
        Window.Open('compile');

        setTimeout(() => {
            var result = Map.Compile(mapObj.__Dir, mapObj, scriptingLanguages, false);
            console.log('Map compiled:', result);

            applicationBroadcastEvent('mapCompiled', result);
        }, 2000)

    },

    updateMapInfo: function(event, newInfo) {
        // Applies a recursive, partial update to mapObj.info
        applyPartialObjectUpdate(mapObj.info, newInfo);
    },

    requestProject: function(event, data) {
        // Send the Map back to the requesting window
        event.sender.webContents.send('responseProject', mapObj);
    },


    /*
     * Object Editor
     */
    newObject: function(event, data) {
        // Add new object to mapObj, with custom name specified
        var mapObjName = data.type + 's'; // e.g. units, doodads, etc.
        mapObj.objects[mapObjName].custom[data.id] = [{
            id: 'unam', // TODO: unam, inam, etc.
            type: 'string',
            value: data.name
        }];

        // Send event to all windows
        applicationBroadcastEvent('newCustomObject', data);
    },
    editObject: function(event, data) {
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

    requestIdCounter: function(event, data) {
        event.sender.webContents.send('responseIdCounter', getNextIdCounter(data.type));
    },


    /*
     * Triggers
     */
    newTrigger: function(event, data) {
        // TODO: check for conflicting trigger paths
        var newTriggerFilePath = path.resolve(mapObj.__Dir, 'triggers/', (data.name + '.' + data.language.substr(1))),
            newTrigger = {
                name: data.name,
                path: newTriggerFilePath,
                language: data.language,
                content: ''
            };

         // Create a new file in the project
        fs.ensureFileSync(newTriggerFilePath);

         // Create a new trigger in the map
        mapObj.triggers.push(newTrigger)

        applicationBroadcastEvent('newTrigger', newTrigger);
    },
    editTrigger: function(event, data) {
        // Update a specified trigger's contents
        var triggerToUpdate = mapObj.triggers.find((t) => {
            return t.name === data.name;
        });

        if(triggerToUpdate) {
            triggerToUpdate.content = data.content;
        }
    },

    requestTriggers: function(event, data) {
         event.sender.webContents.send('responseTriggers', mapObj.triggers);
     },
    requestScriptingLanguages: function(event, data) {
         event.sender.webContents.send('responseScriptingLanguages', scriptingLanguages);
     },


    /*
     * Windows
     */
    openWindow: function(event, data) {
        if(!data || !data.windowName) return false;

        Window.Open(data.windowName, data.template);
    },
    registerWindow: function(event, manifest) {
        // TODO: is the window protected??
        Window.availableWindows[manifest.name] = manifest;
    },


    /*
     * Imports
     */
    newImport: function(event, file) {
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
    editImport: function(event, file) {
        var importToUpdate = mapObj.imports.find(
             (imp) => { return imp.name == file.name; }
        );

        if(importToUpdate) {
            // This is the only attribute that can be changed
            // since size, name, and type are not modified by user
            if(file.fullPath) importToUpdate.fullPath = file.fullPath;
            applicationBroadcastEvent('importUpdated', importToUpdate);
        }
    },

    requestImportList: function(event, data) {
        event.sender.webContents.send('responseImportList', mapObj.imports);
    },


    /*
     * Misc
     */
    log: function(event, data) {
        const logRecord = {
            type: data.type,
            message: data.message,
            timestamp: new Date() - 0
        };

        log.push(logRecord);
        applicationBroadcastEvent('logAdded', logRecord);
    },
    getLog: function(event, data) {
        applicationBroadcastEvent('responseLog', log);
    },
    clearLog: function() {
        log = [];
        applicationBroadcastEvent('logCleared', null);
    },

    requestUserInput: function(event, data) {
        var inputWindowName = 'input' + data.type[0].toUpperCase() + data.type.substr(1); // e.g. inputInt

        if(Window.availableWindows[inputWindowName]) {
            Window.Open(inputWindowName, data.context);
        }
        else {
            Window.Open('inputUnknown', data.context);
        }
    },
    responseUserInput: function(event, data) {
        applicationBroadcastEvent('userInputProvided', data);
    },

    setGlobalSetting: function(event, obj) {
        Settings.SetGlobal(obj.name, obj.data);
    },
    setLocalSetting: function(event, obj) {
        var pluginSettings = Settings.GetLocal(obj.plugin) || {};
        pluginSettings[obj.name] = obj.data;

        Settings.SetLocal(obj.plugin, pluginSettings);
    },
}

// FUTURE:
// We can use app.addRecentDocument(path) and app.setUserTasks(tasks) in the future
// for enhanced Taskbar utility. See the `app` documentation for more details

// Auto-Updates
autoUpdater.on('checking-for-update',   () => { applicationBroadcastEvent('checkingForUpdate'); })
autoUpdater.on('update-available',      (ev, info) => {
    // Open check-for-updates window
    Window.Open('update');

    applicationBroadcastEvent('updateAvailable', info);
})
autoUpdater.on('update-not-available',  (ev, info) => { applicationBroadcastEvent('updateNotAvailable', info); })
autoUpdater.on('error',                 (ev, err) => { applicationBroadcastEvent('updateError', err); })
autoUpdater.on('download-progress',     (ev, progressObj) => { applicationBroadcastEvent('downloadProgress', progressObj ); })
autoUpdater.on('update-downloaded',     (ev, info) => {
  applicationBroadcastEvent('updateDownloaded', info);

   // Wait 4 seconds, then quit and install
  setTimeout(function() {
    autoUpdater.quitAndInstall();
  }, 4000)
})


// Expose globals for plugins
app.Events = EventHandlers;
app.pluginSystem = { listeners: {} };

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if(isDev) {
        autoUpdater.logger = require("electron-log")
        autoUpdater.logger.transports.file.level = "info"
    }
    else {
        // Only check for updates in production
        // Otherwise, the development unnecessarily hits the GitHub releases
        // channel and spams the output log
        autoUpdater.checkForUpdates();
    }

    // Create the main menu from the menu template
    menu = Menu.buildFromTemplate(appMenuTemplate);
    Menu.setApplicationMenu(menu);

    console.log('App Path', global.globals.AppDataPath)
    console.log('Plugin Path', global.globals.PluginPath)

    app.setName('Ice Sickle'); // From package.json it's icesickle (since npm init required lowercase, no spaces)

    // Load plugins from /plugins directory
    PluginManager.LoadPlugins(module, EventHandlers);

    // Add plugins to the extension menu list, if allowed
    Object.keys(PluginManager.loadedPlugins).forEach((pluginName) => {
        var pluginObj = PluginManager.loadedPlugins[pluginName];

        if(pluginObj.module.onMenuClick) {
            menu.items[6].submenu.insert(0, new MenuItem({
                click: pluginObj.module.onMenuClick,
                label: pluginObj.manifest.icesickle.title
            }));
        }
    });

    // Register each custom scripting language
    loadScriptingLanguages();

    // Create main window
    Window.Open('root', null, {
        // When the root window closes, close the entire application
        close: function() {
            app.quit();
        }
    });

    // Register IPC events
    Object.keys(EventHandlers).forEach((eventKey) => {
        ipcMain.on(eventKey, EventHandlers[eventKey]);
    });

    // Open welcome dialog
    function iceProjectFilterFn(fileObj) {
        var filePathParts = fileObj.path.split('\\');
        filePathParts = filePathParts.slice(filePathParts.indexOf('icesickle'));

        if(filePathParts.length === 3) return true;
        return false;
    };
    var iceProjects = klawSync(global.globals.ProjectsPath, { nofile: true, filter: iceProjectFilterFn }).map((entry) => {
        return {
            name: entry.path.split('\\').reverse()[0],
            path: entry.path.replace(/\\/g, "\\\\")
        };
    });
    Window.Open('welcome', {
        recent: iceProjects
    })

    // Add the 'exit' menu item to File
    menu.items[0].submenu.append(new MenuItem({
        type: 'separator'
    }));
    menu.items[0].submenu.append(new MenuItem({
        label: 'Exit',
        sublabel: 'Quits the application',
        role: 'quit'
    }));

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
