/**
 * MPQEditorQueue.js
 * Provides functionality to interact with Ladik's MPQEditor
 * to create and modify WarCraft III archives (.w3x). this
 * stores commands sequentially, and then executes them all
 * at once when .execute() is called.
 */

const Path = require('path');
const proc = require('child_process');
var MPQEditorExePath = Path.join(__dirname, 'MPQEditor.exe');

var commands = [];
const joinSequence = ' && '; // See: https://superuser.com/a/62854

module.exports = function MPQEditorQueue(mpqFilePath) {
    const mpqFile = mpqFilePath;

    return {
        New: function() {
            commands.push(`new "${mpqFile}"`);
        },
        Add: function(sourceFile, targetFile) {
            commands.push(`add "${mpqFile}" "${sourceFile}" "${targetFile}"`);
        },
        Rename: function(oldFileName, newFileName) {
            commands.push(`rename "${mpqFile}" "${oldFileName}" "${newFileName}"`);
        },
        Move: function(fileName, newDirectory) {
            commands.push(`move "${mpqFile}" "${fileName}" "${newDirectory}"`);
        },
        Delete: function(fileName) {
            commands.push(`delete "${mpqFile}" "${fileName}"`);
        },
        Flush: function() {
            commands.push(`flush "${mpqFile}"`);
        },

        Execute: function() {
            // Format each command to have the path to the MPQEditor.exe in front
            // and also concatenate them into one large command
            const commandString = commands.map((cmd) => {
                return `"${MPQEditorExePath}"` + ' ' + cmd;
            }).join(joinSequence);

            // Execute the commands
            console.log('.w3x Archive:', commandString);
            proc.execSync(commandString);
        }
        //Open: function(mpqFile) {},
        //Close: function() {},
    }
};
