import { Logger } from './Logger';
import { Settings } from './Settings';
import { EventMgr, EventListener } from './EventMgr';
import { EventType } from './EventType';

export abstract class ExtensionAPI {
    static Logger = Logger
    static Settings = Settings
    static EventMgr = EventMgr
    static EventListener = EventListener
    static EventType = EventType
}
