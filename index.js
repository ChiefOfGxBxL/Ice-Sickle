const {app, BrowserWindow, Menu, dialog, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New',
        sublabel: 'Create a new project',
        role: 'new',
        click () {
            var newProjectWin = new BrowserWindow({
                width: 360,
                height: 435,
                parent: win,
                modal: true,
                frame: false
            });
            
            newProjectWin.loadURL(url.format({
              pathname: path.join(__dirname, '/views/new-project.html'),
              protocol: 'file:',
              slashes: true
            }));
            
            newProjectWin.on('closed', () => {
              newProjectWin = null
            })
        }
      },
      {
        label: 'Open',
        sublabel: 'Open a project',
        role: 'open',
        click () {
            dialog.showOpenDialog({
                title: 'Open project',
                defaultPath: '',
                buttonLabel: '',
                filters: [],
                properties: ['openDirectory']
            }, function(projects) {
                // should only be one project selected
                if(projects) {
                    // Tell any renderer processes that a map load request has been initiated
                    win.webContents.send('open-project', projects[0]);
                }
            });
        },
      },
      {
        label: 'Save',
        sublabel: 'Saves the current project',
        role: 'save',
        click () {
            win.webContents.send('save-project');
        }
      },
      {
        type: 'separator'
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
                parent: win,
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

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1000, height: 750})

  // Create the main menu from the template
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, '/views/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Received message from new-project menu
  ipcMain.on('create-new-project', (event, data) => {
      console.log(data);
      win.webContents.send('create-new-project', data);
  });
  
  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

