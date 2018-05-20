import { ExtensionAPI } from './ExtensionAPI';

const
    Path = require('path'),
    fs = require('fs-extra');

export class Extension {

    Name: string
    Version: string

    Directory: string
    Module: any
    Manifest: {}
    ManifestPath: string

    IsLoaded: boolean = false

    constructor(directory: string) {
        // Set information of Extension
        this.Directory = directory;
        this.ManifestPath = Path.resolve(directory, 'package.json');
        this.Manifest = fs.readJsonSync(this.ManifestPath);
        this.Module = require(this.Directory);
    }

    public Load() {
        if(!this.IsLoaded) {
            this.Module(ExtensionAPI);
            this.IsLoaded = true;
        }
    }

    public Unload() {
        // Unregister event listeners :: TODO

    }

}
