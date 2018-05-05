/**
 * @module bootstrap.js
 * Bootstraps the application to ensure all necessary files, folders,
 * and other dependencies exist before continuing to launch the app.
 */

const
    fs = require('fs-extra'),
    Path = require('path'),
    {app} = require('electron'),
    isDev = require('electron-is-dev'),
    cp = require('child_process'),

    IceSickleDirectory = Path.join(app.getPath('documents'), 'icesickle'),
    PluginsDirectory = Path.join(IceSickleDirectory, 'plugins'),
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
        installJASS(isDev);
    }
}

function installJASS(isDev) {
    console.info('Installing JASS language', '[dev]', isDev);
    if(isDev) {
        cp.exec('npm install wc3-jass', function(err, stdout, stderr) {
            if(err) {
                throw "Error: unable to install wc3-jass language";
            }
            else {
                // Now that the package is installed, it should
                // be copied to the scripting directory
                console.info('Downloaded wc3-jass');
                fs.copySync(
                    './node_modules/wc3-jass',
                    Path.join(ScriptingLanguagesDirectory, 'JASS')
                );
            }
        });
    }
    else {
        fs.copySync(
            './node_modules/wc3-jass',
            Path.join(ScriptingLanguagesDirectory, 'JASS')
        );
    }
}
