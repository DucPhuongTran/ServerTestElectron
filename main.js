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
const http_proxy_middleware_1 = require("http-proxy-middleware");
const expressAppUI = express();
let win = null;
let UIPort = 4200;
const startMode = electron_1.app.commandLine.getSwitchValue("mode");
const runFromLauncher = electron_1.app.commandLine.hasSwitch("launcher");
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
    let pathFound = resolvePath("i:/Code/0.Code/Synergis/Dev/Foxit/index.html");
    if (pathFound == "") {
        console.log("Could not find the WebUI directory");
        quitApp();
    }
    pathFound = path.dirname(pathFound);
    expressAppUI.use("/help", express.static(path.join(__dirname, "help")));
    expressAppUI.use("/fileserver", (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: `http://localhost:11180`,
        changeOrigin: true,
        pathRewrite: {
            [`^/fileserver`]: "",
        },
    }));
    // Set Service-Worker-Allowed header for MessageWorker.js
    expressAppUI.use(`/lib/MessageWorker.js`, (req, res, next) => {
        res.setHeader('Service-Worker-Allowed', '/');
        next();
    });
    // Set Service-Worker-Allowed header for WebPDFJRWorker.js
    expressAppUI.use(`/lib/WebPDFJRWorker.js`, (req, res, next) => {
        res.setHeader('Service-Worker-Allowed', '/');
        next();
    });
    expressAppUI.get("*.*", express.static(pathFound, { maxAge: 1000 }));
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
//# sourceMappingURL=main.js.map