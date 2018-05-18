const colors = require('colors');

export class LogEntry {

    type: LogEntryType
    message: string
    timestamp: number

    constructor(type: LogEntryType, message: string, timestamp: number) {
        this.type = type;
        this.message = message;
        this.timestamp = timestamp;
    }

}

export enum LogEntryType {
    "Info",
    "Warning",
    "Error"
}

export abstract class Logger {

    private static entries: LogEntry[] = [];

    private static SquareBracketText(text: string, color: string): string {
        return '[' + colors[color](text) + ']';
    }

    private static GetCurrentTimestamp(): number {
        return (new Date()).valueOf();
    }

    public static Info(msg: string) {
        console.info(this.SquareBracketText('Info', 'blue'), msg);
        this.entries.push(new LogEntry(LogEntryType.Info, msg, this.GetCurrentTimestamp()));
    }

    public static Warn(msg: string) {
        console.warn(this.SquareBracketText('Warn', 'yellow'), msg);
        this.entries.push(new LogEntry(LogEntryType.Warning, msg, this.GetCurrentTimestamp()));
    }

    public static Error(msg: string) {
        console.error(this.SquareBracketText('Error', 'red'), msg);
        this.entries.push(new LogEntry(LogEntryType.Error, msg, this.GetCurrentTimestamp()));
    }

    public static GetEntries() {
        return this.entries;
    }

    public static Clear() { this.entries = []; }

}
