"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const fs = require("fs");
const express = require("express");
var Registry = require("winreg");
const expressAppUI = express();
let win = null;
let UIPort = 4200;
const startMode = electron_1.app.commandLine.getSwitchValue("mode");
let lastPosition = [];
const runFromLauncher = electron_1.app.commandLine.hasSwitch("launcher");
const ViewerPath = "e:/0.Code/0.Code/Dev/BuildViewer/AdeptWebViewer/index.html";
// const ViewerPath = "e:/0.Code/0.Code/Dev/BuildViewer/AdeptWebViewer_Build/index.html"
// const ViewerPath = "e:/0.Code/0.Code/Dev/ViewerWebUI_Hicas_Dev/dist/AdeptWebViewer/index.html";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
console.log("StartMode=", startMode);
console.log("Launcher=", runFromLauncher);
electron_1.app.whenReady().then(() => {
    electron_1.app.setAppUserModelId("Synergis.Adept.Viewer");
    console.log("App started");
    // checkRunFromLauncher().subscribe((launcherRun) => {
    //   console.log("Launcher=", runFromLauncher);
    //   if (launcherRun === false) {
    //     let options = {
    //       buttons: ["OK"],
    //       title: "Adept Viewer",
    //       message: "The Adept Viewer application must be run from Adept.",
    //     };
    //     dialog.showMessageBox(options).then((data) => {
    //       app.quit();
    //     });
    //   } else {
    //     showSplash();
    //     startApp();
    //   }
    // });
    startApp();
});
electron_1.app.on("activate", () => __awaiter(void 0, void 0, void 0, function* () {
    if (win === null) {
        startApp();
    }
}));
function startApp() {
    startUIServer();
    createMainWindow();
}
function resolvePath(startPath) {
    // If the path is already absolute, use it directly
    if (path.isAbsolute(startPath)) {
        if (fs.existsSync(startPath)) {
            console.log(`Absolute path exists: ${startPath}`);
            return startPath;
        }
        else {
            console.log(`Absolute path does not exist: ${startPath}`);
            return "";
        }
    }
    // Otherwise, try relative to __dirname
    let currentPath = path.join(__dirname, startPath);
    if (fs.existsSync(currentPath)) {
        console.log(`Path exists ${currentPath}`);
        return currentPath;
    }
    else {
        currentPath = path.resolve(`./${startPath}`);
        if (fs.existsSync(currentPath)) {
            console.log(`Path Exists ${currentPath}`);
            return currentPath;
        }
        else {
            console.log(`Path doesn't exist ${currentPath}`);
            currentPath = path.resolve(`../${startPath}`);
            console.log(`Trying Path: ${currentPath}`);
            if (fs.existsSync(currentPath)) {
                return currentPath;
            }
            else {
                console.log(`Could not find the path for ${currentPath}`);
                return "";
            }
        }
    }
}
function startUIServer() {
    // let pathFound = resolvePath("i:/Code/0.Code/Synergis/Dev/ViewerWebUI_Hicas/dist/AdeptWebViewer/index.html");
    // let pathFound = resolvePath("Foxit/index.html");
    let pathFound = resolvePath(ViewerPath);
    if (pathFound == "") {
        console.log("Could not find the WebUI directory");
        quitApp();
    }
    pathFound = path.dirname(pathFound);
    expressAppUI.use("/help", express.static(path.join(__dirname, "help")));
    expressAppUI.use(express.static(pathFound, {
        maxAge: 1000,
        setHeaders: (res, filePath) => {
            // Starting from FoxitPDFSDK for Web version 10.0.0, since service worker is used,
            // it is necessary to add this field in the HTTP response header of the Service Worker script
            if (filePath.endsWith('MessageWorker.js') || filePath.endsWith('WebPDFJRWorker.js')) {
                res.setHeader('Service-Worker-Allowed', '/');
            }
            // Fix: .wasm Not Recognized as WebAssembly
            if (filePath.endsWith('.wasm')) {
                res.setHeader('Content-Type', 'application/wasm');
            }
        },
    }));
    expressAppUI.all("*", function (req, res) {
        res.status(200).sendFile(`/`, { root: pathFound });
    });
    expressAppUI.listen(UIPort, () => {
        console.log("UI Web Server is listening on port " + UIPort);
    });
}
function quitApp() {
    console.log("Application is quitting....");
    if (win) {
        console.log("closing main window");
        win.destroy();
    }
    electron_1.app.quit();
}
function createMainWindow() {
    win = new electron_1.BrowserWindow({
        width: 1600,
        height: 900,
        // frame: false,
        // titleBarStyle: "hidden",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: true,
            webSecurity: false,
        },
    });
    win.loadURL(`http://localhost:${UIPort}/open`);
    win.on("closed", () => {
        electron_1.ipcMain.removeAllListeners();
        win = null;
    });
    win.webContents.on("will-prevent-unload", (event) => {
        event.preventDefault();
    });
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: Object.assign({ "Access-Control-Allow-Origin": ["*"], 
                // We use this to bypass headers
                "Access-Control-Allow-Headers": ["*"] }, details.responseHeaders),
        });
    });
    win.webContents.session.clearCache().then(() => {
        console.log("Cache cleared for current session");
    });
    win.removeMenu();
    win.on("close", (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        win.webContents.send("app-closing");
    }));
    win.once("focus", () => win.flashFrame(false));
    //win.webContents.openDevTools();
    electron_1.ipcMain.on("app-close", (e) => {
        lastPosition = win.getPosition();
        if (win) {
            try {
                win.webContents.closeDevTools();
                win.close();
                win.destroy();
                win = null;
            }
            catch (error) {
                console.log(error);
            }
        }
    });
    win.webContents.openDevTools();
}
//# sourceMappingURL=main.js.map