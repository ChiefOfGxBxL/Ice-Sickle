/**
 * @module bootstrap.js
 * Bootstraps the application to ensure all necessary files, folders,
 * and other dependencies exist before continuing to launch the app.
 */

const
    fs = require('fs-extra'),
    Path = require('path'),
    {app} = require('electron'),
    cp = require('child_process'),

    IceSickleDirectory = Path.join(app.getPath('documents'), 'icesickle'),
    PluginsDirectory = Path.join(IceSickleDirectory, 'extensions'),
    ProjectsDirectory = Path.join(IceSickleDirectory, 'projects'),
    ScriptingDirectory = Path.join(IceSickleDirectory, 'scripting'),
    ScriptingLanguagesDirectory = Path.join(ScriptingDirectory, 'languages'),
    ScriptingSnippetsDirectory = Path.join(ScriptingDirectory, 'snippets'),
    JASSDirectory = Path.join(ScriptingLanguagesDirectory, 'JASS'),

    SettingsPath = Path.join(IceSickleDirectory, 'settings.json');

module.exports = function bootstrap() {
    console.info('Bootstrapping application...');

    ensureDirectories();
    ensureSettingsFile();
    ensureJASSScript();

    console.info('Bootstrap successful');
    return;
};


function ensureDirectories() {
    fs.ensureDirSync(IceSickleDirectory);
    fs.ensureDirSync(PluginsDirectory);
    fs.ensureDirSync(ProjectsDirectory);
    fs.ensureDirSync(ScriptingDirectory);
    fs.ensureDirSync(ScriptingLanguagesDirectory);
    fs.ensureDirSync(ScriptingSnippetsDirectory);
};

function ensureSettingsFile() {
    if(!fs.existsSync(SettingsPath)) {
        fs.copySync(Path.join(__dirname, 'settings.json'), SettingsPath);
    }
};

function ensureJASSScript() {
    try {
        require(JASSDirectory);
    }
    catch(e) {
        // JASS language could not be loaded, so download it
        console.info('JASS scripting language is missing');
        installJASS();
    }
}

function installJASS() {
    console.info('Installing JASS language');

    try {
        // Development environment
        // wc3-jass is installed as a devDependency, so we can copy out of
        // node_modules; be sure to `npm install` to ensure success
        fs.copySync(
            './node_modules/wc3-jass',
            Path.join(ScriptingLanguagesDirectory, 'JASS')
        );
    }
    catch(e) {
        // Pack or dist environment
        // When the application is distributed, the wc3-jass package will
        // be bundled into the resources directory next to the .asar file
        // based on the node-builder configuration's `extraResources`
        fs.copySync(
            './resources/node_modules/wc3-jass',
            Path.join(ScriptingLanguagesDirectory, 'JASS')
        );
    }

    // Perform an `npm install` under the wc3-jass module
    // to install its dependencies
    cp.exec('npm install', { cwd: JASSDirectory }, function(err, stdout, stderr) {
        if(err) {
            throw "Error: Unable to install wc3-jass dependencies";
        }
    })
}
