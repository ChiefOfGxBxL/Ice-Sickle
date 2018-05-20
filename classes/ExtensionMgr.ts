import { Extension } from './Extension';

const
    { app } = require('electron'),
    Path = require('path'),
    fs = require('fs-extra'),
    klaw = require('klaw-sync'),
    https = require('https'),
    targz = require('targz'),
    cp = require('child_process');

const ExtensionDirectory = Path.join(app.getPath('documents'), 'icesickle', 'extensions');

export abstract class ExtensionMgr {

    private static Extensions: Extension[] = []

    private static GetExtensionFullDir(name: string) {
        return Path.join(ExtensionDirectory, name);
    }

    public static RegisterExtension(name: string): Extension {
        // Get the full path to the extension directory
        // E.g. .../My Documents/icesickle/extensions/ice-hello-world
        let extensionFullDir = this.GetExtensionFullDir(name);

        // Create a new instance of the Extension and store it
        let loadedExtension = new Extension(extensionFullDir);
        this.Extensions.push(loadedExtension);
        return loadedExtension;
    }

    public static GetExtensionByName(name: string): Extension {
        for(let i = 0; i < this.Extensions.length; i++) {
            if(this.Extensions[i].Name === name) return this.Extensions[i];
        }
        return null;
    }

    public static Install(name: string, version: string) {
        const tarURL = `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`;
        const localTarDir = this.GetExtensionFullDir(name);
        const tarFile = Path.join(localTarDir, 'ext.tgz');

        // Download the tgz file locally
        const FileDownloader = require('./FileDownloader.js');
        FileDownloader.DownloadFile(tarURL, localTarDir, function(errFile, resultFile) {
            if(errFile) {}
            else {
                // Extract the tgz file
                targz.decompress({
                    src: tarFile,
                    dest: localTarDir
                }, function(err){
                    if(err) {
                        console.log(err);
                    }
                    else {
                        // The directory has a folder called 'package' that we want to hoist the files out of
                        const packageDirectory = Path.join(localTarDir, 'package');
                        fs.copySync(packageDirectory, localTarDir);
                        fs.removeSync(packageDirectory);
                        fs.removeSync(tarFile);

                        // Run npm install on the extension
                        cp.execSync('npm install', { cwd: localTarDir });

                        // Register the extension
                        this.RegisterExtension(name);
                    }
                });
            }
        });
    }

    public static Uninstall(name: string) {

        // Make sure the extension is properly unloaded
        const extension = this.GetExtensionByName(name);
        extension.Unload();

        // Delete the extension from the extension directory
        const extensionDir = this.GetExtensionFullDir(name);
        fs.removeSync(extensionDir, function(err, result) {});

    }

    public static GetExtensions(): Extension[] {
        return this.Extensions;
    }

}
