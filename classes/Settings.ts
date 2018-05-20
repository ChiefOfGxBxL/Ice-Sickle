const fs = require('fs-extra'),
    Path = require('path');

export abstract class Settings {

    public static SettingsPath: string
    private static _settings = {}
    private static isLoaded: boolean = false

    private static EnforceLoadPolicy(action?: string) {
        if(!this.isLoaded) {
            console.error('You must call Settings.Load() before calling', action);
            return -1;
        }
    }

    public static Get(name: string): any {
        if(Settings.EnforceLoadPolicy('Get()') === -1) return;
        return this._settings[name];
    }
    public static Set(name: string, value: any): void {
        if(Settings.EnforceLoadPolicy('Set()') === -1) return;
        this._settings[name] = value;
    }

    public static Save(): void {
        if(Settings.EnforceLoadPolicy('Save()') === -1) return;
        fs.ensureFileSync(this.SettingsPath);
        fs.writeJsonSync(this.SettingsPath, this._settings);
    }
    public static Load(settingsJsonPath): void {
        // Store data in class
        this.SettingsPath = settingsJsonPath;
        this.isLoaded = true;

        // Load the settings into memory
        if(fs.existsSync(settingsJsonPath)) {
            this._settings = fs.readJsonSync(this.SettingsPath);
        }
        else {
            // Warn if the settings.json file path does not exist
            // Note: this is not an error; the code can continue and
            // will save a new .json file at the provided path.
            console.warn('Warning: The settings.json file is missing at', settingsJsonPath);
        }
    }

}
