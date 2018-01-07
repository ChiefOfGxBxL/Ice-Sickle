/*
 Globals
 */
var remote = require('electron').remote
    globals = remote.getGlobal('globals');

/*
 IPC
 */
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the page to load.. otherwise some of these
    // actions may not work
    const {ipcRenderer} = require('electron');
})
