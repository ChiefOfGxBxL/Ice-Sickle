export enum EventType {

    // Application
    ApplicationLaunch,
    ApplicationReady,
    LogAdded,
    LogCleared,

    // Project
    ProjectCreated,
    ProjectLoaded,
    ProjectSaved,
    ProjectCompiled,

    // Object Editor
    ObjectCreated,
    ObjectModified,
    ObjectDeleted,

    // Trigger Editor
    TriggerCreated,
    TriggerModified,
    TriggerDeleted,

    // Import Manager
    ImportCreated,
    ImportModified,
    ImportDeleted,

    // Extensions

    // Views

    // User Interaction

    // Settings

    // Auto-updater
    UpdateCheckStarted,
    UpdateAvailable,
    UpdateNotAvailable,
    UpdateErrorOccurred,
    UpdateDownloadProgress,
    UpdateDownloaded,

    // Misc.
    CustomEvent
}
