/*
 Globals
 */
var remote = require('electron').remote
    globals = remote.getGlobal('globals');

/*
 IPC
 */
// Usage: ipc.send('eventName', {data: 5})
// var {ipcRenderer} = require('electron');
