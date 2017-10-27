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

module.exports = function MPQEditorQueue() {
    return {
        New: function(mpqFile) {
            commands.push(`new "${mpqFile}"`);
        },
        Add: function(mpqFile, sourceFile, targetFile) {
            commands.push(`add "${mpqFile}" "${sourceFile}" "${targetFile}"`);
        },
        Rename: function(mpqFile, oldFileName, newFileName) {
            commands.push(`rename "${mpqFile}" "${oldFileName}" "${newFileName}"`);
        },
        Move: function(mpqFile, fileName, newDirectory) {
            commands.push(`move "${mpqFile}" "${fileName}" "${newDirectory}"`);
        },
        Delete: function(mpqFile, fileName) {
            commands.push(`delete "${mpqFile}" "${fileName}"`);
        },
        Flush: function(mpqFile) {
            commands.push(`flush "${mpqFile}"`);
        },

        Execute: function() {
            // Format each command to have the path to the MPQEditor.exe in front
            // and also concatenate them into one large command
            const commandString = commands.map((cmd) => {
                return `"${MPQEditorExePath}"` + ' ' + cmd;
            }).join(joinSequence);

            // Execute the commands
            proc.execSync(commandString);
        }
        //Open: function(mpqFile) {},
        //Close: function() {},
    }
};
