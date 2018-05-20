import { View } from './View';

export abstract class ViewMgr {

    static AvailableViews: View[] = []

    private static GetViewFromArray(name: string, array: View[]): View {
        let foundView: View = null;

        array.forEach((view) => {
            if(view.Name === name) {
                foundView = view;
            }
        });

        return foundView;
    }

    public static LoadView(directory: string) {
        // Directory must contain: view.json
        let loadedView = new View(directory);
        this.AvailableViews.push(loadedView);
    }

    public static GetViewByName(name: string): View {
        let viewToOpen = this.GetViewFromArray(name, this.AvailableViews);
        return viewToOpen;
    }

    public static Broadcast(eventName: string, data) {
        console.log('[ View Event ]', eventName);

        this.AvailableViews.forEach((view) => {
            view.Window.webContents.send(eventName, data);
        });
    }

}
