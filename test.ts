import { Logger } from "./classes/Logger";

Logger.Info("create info");
Logger.Warn("you warned!");
Logger.Error("ahh, an error!!");

console.log(Logger.GetEntries());
