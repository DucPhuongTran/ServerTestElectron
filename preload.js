const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["openModal", "app-close", "app-show-html-help", "app-show-pdf-help", "app-minimize", "app-maximize", "app-restore"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
            
        },
        receive: (channel, func) => {
            let validChannels = ["app-closing", "app-openfiles"];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);
