const nanoid = require('nanoid'); // Generates random uuids

import { EventType } from './EventType';

export class EventListener {
    uuid: string
    eventType: EventType
    fn: Function

    constructor(eventType: EventType, fn: Function) {
        this.uuid = nanoid();
        this.eventType = eventType;
        this.fn = fn;
    }
}

export abstract class EventMgr {

    private static EventListeners: EventListener[] = []

    public static RegisterListener(eventType: EventType, fn: Function): EventListener {
        let newListener = new EventListener(eventType, fn);
        this.EventListeners.push(newListener);
        return newListener;
    }

    public static DestroyListener(listener: EventListener | string) {
        let uuid: string = null;

        if(typeof listener === 'string') {
            uuid = listener;
        }
        else {
            uuid = listener.uuid;
        }

        // Find in array and remove it
        let indexInListenerArray = this.EventListeners.findIndex((list) => {
            if(list.uuid === uuid) return true;
        });
        this.EventListeners.splice(indexInListenerArray, 1);
    }

    public static Emit(eventType: EventType, data: {}) {
        // Iterate through all the registered listeners
        this.EventListeners.forEach((listener) => {
            // If the listener matches the type, call its delegate function
            if(listener.eventType === eventType) {
                listener.fn(data);
            }
        })
    }

}
