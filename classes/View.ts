const
    fs = require('fs-extra'),
    Path = require('path'),
    Url = require('url'),
    { BrowserWindow } = require('electron');

interface ViewOptions {
    name: string,
    path: string,
    description: string,
    width: number,
    height: number,
    parent: string,
    modal: boolean,
    frame: boolean,
    resizable: boolean,
    allowMultiple: boolean,
    requiresTemplate: boolean
}

export class View {

    Name: string
    JsonPath: string
    ViewPath: string
    Options = {}

    IsOpen: boolean = false
    IsInitialized: boolean = false

    Window: Electron.BrowserWindow

    constructor(directory: string) {
        if(fs.existsSync(directory)) {
            this.JsonPath = Path.join(directory, 'view.json');

            const manifest = fs.readJsonSync(this.JsonPath);
            this.Name = manifest.name;
            this.ViewPath = Path.join(directory, manifest.path);
            this.Options = manifest;

            this.Options['webPreferences'] = {
                // Set preload on all windows to run the global-script
                // so globals are available to every window via `globals` variable
                preload: Path.join(__dirname, '../assets/js/preload.js')
            }
        }
        else {
            console.error('Error: unable to load view', directory);
        }
    }

    private EnsureInitialized() {
        if(!this.IsInitialized || this.Window === null) {
            this.Window = new BrowserWindow(this.Options);
            this.IsInitialized = true;
        }
    }

    public Open(data?: {}, events?: {}) {
        this.EnsureInitialized();

        // Open the view, checking if multiple instances are allowed
        // or if only one can be open at a time
        if(this.IsOpen) {
            // Can we open another instance?
            if(this.Options['allowMultiple']) {
                this._openView(data, events);
            }
            else {
                // Open() called on single-instance-only View, so focus existing one
                this.Window.focus();
            }
        }
        else {
            this._openView(data, events);
        }
    }

    public Close() {
        if(this.IsOpen) {
            this.Window.close();
            this.Window = null;
            this.IsOpen = false;
        }
    }

    public SendMessage(eventName: string, data) {
        this.Window.webContents.send(eventName, data);
    }

    private _openView(data?: {}, events?: {}) {
        // Try to set the parent of this BrowserWindow to the
        // one specified in the View's manifest
        if(this.Options['parent']) {
            // let parentView = ViewMgr.GetViewByName(this.Options['parent']);
            // if(parentView !== null) {
            //     this.Window.setParentWindow(parentView.Window);
            // }
        }

        // We'll use Handlebars templating if:
        //  * The view manifest specifies it requires it [OR]
        //  * Data was provided to this Open() call
        const isHandlebars = this.Options['requiresTemplate'] || !!data;

        // Encode any template data in the POST body
        let addlData = {};
        if(isHandlebars && data) {
            addlData = {
                // Encode handlebars template in post data
                postData: [{
                    type: 'rawData',
                    bytes: Buffer.from(JSON.stringify(data))
                }],
                extraHeaders: 'Content-Type: application/x-www-form-urlencoded'
            };
        }

        // Load up the view, including any data to provide in the template
        this.Window.loadURL(
            Url.format({
                pathname: this.ViewPath,
                protocol: (isHandlebars) ? 'hbs:' : 'file:',
                slashes: true
            }),
            addlData
        );

        this.IsOpen = true;

        // TODO: register events to the BrowserWindow
        if(events) {
            Object.keys(events).forEach((eventName) => {
                // this.Window.on(eventName, () => {
                //     events[eventName]();
                // });
            });
        }

        this.Window.on('closed', () => {
            this.IsOpen = false;
        })
    }

}
