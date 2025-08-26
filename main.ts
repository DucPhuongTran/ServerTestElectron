import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  dialog,
  SaveDialogSyncOptions,
  FileFilter,
} from "electron";
import * as path from "path";
import { of, merge, from, Observable, forkJoin, throwError } from "rxjs";
import * as fs from "fs";
import * as express from "express";
var Registry = require("winreg");
import { kill } from "process";
import { format } from "path";
import {
  createProxyMiddleware,
  Filter,
  Options,
  RequestHandler,
} from "http-proxy-middleware";
const expressAppUI: express.Application = express();
let win: BrowserWindow | null = null;
let UIPort = 4200;
const startMode = app.commandLine.getSwitchValue("mode");

const runFromLauncher = app.commandLine.hasSwitch("launcher");
const ViewerPath = "C:/Synergis/ViewerWebUI_Hicas/dist/AdeptWebViewer/index.html"


process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

console.log("StartMode=", startMode);
console.log("Launcher=", runFromLauncher);
app.whenReady().then(() => {
  app.setAppUserModelId("Synergis.Adept.Viewer");
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

app.on("activate", async () => {
  if (win === null) {
    startApp();
  }
});
function startApp() {
  startUIServer();
}
function resolvePath(startPath) {
  // If the path is already absolute, use it directly
  if (path.isAbsolute(startPath)) {
    if (fs.existsSync(startPath)) {
      console.log(`Absolute path exists: ${startPath}`);
      return startPath;
    } else {
      console.log(`Absolute path does not exist: ${startPath}`);
      return "";
    }
  }
  // Otherwise, try relative to __dirname
  let currentPath = path.join(__dirname, startPath);
  if (fs.existsSync(currentPath)) {
    console.log(`Path exists ${currentPath}`);
    return currentPath;
  } else {
    currentPath = path.resolve(`./${startPath}`);
    if (fs.existsSync(currentPath)) {
      console.log(`Path Exists ${currentPath}`);
      return currentPath;
    } else {
      console.log(`Path doesn't exist ${currentPath}`);
      currentPath = path.resolve(`../${startPath}`);
      console.log(`Trying Path: ${currentPath}`);
      if (fs.existsSync(currentPath)) {
        return currentPath;
      } else {
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

  // expressAppUI.use(
  //   "/fileserver",
  //   createProxyMiddleware({
  //     target: `http://localhost:11180`,
  //     changeOrigin: true,
  //     pathRewrite: {
  //       [`^/fileserver`]: "",
  //     },
  //   })
  // );

  expressAppUI.use(
    express.static(pathFound, {
      maxAge: 1000,
      setHeaders: (res, filePath: string) => {
        // Starting from FoxitPDFSDK for Web version 10.0.0, since service worker is used,
        // it is necessary to add this field in the HTTP response header of the Service Worker script
        if (filePath.includes('MessageWorker.js') || filePath.includes('WebPDFJRWorker.js')) {
          res.setHeader('Service-Worker-Allowed', '/');
        }
        // Fix: .wasm Not Recognized as WebAssembly
        if (filePath.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        }
      },
    })
  );

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
  app.quit();
}