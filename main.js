const path = require("path")
const fs = require("fs")

const {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    shell
} = require("electron")

const debug = true

const size = {
    start: [ 840, 840 ],
    min: [ 600, 600 ]
}

const supported_exts = ["png", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "svg", "gif", "ico", "cur", "apng", "avif", "webp"]

const createWindow = function() {
    const win = new BrowserWindow({
        width: size.start[0], height: size.start[1],
        minWidth: size.min[0], minHeight: size.min[1],
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: debug,
            openDevTools: debug
        }
    })

    win.loadFile(
        path.join("src", "start screen.html")
    )

    ipcMain.on("homePage", event => {
        win.loadFile(
            path.join("src", "start screen.html")
        )
    })

    ipcMain.on("chapterSelection", event => {
        dialog.showOpenDialog({ properties: ["openDirectory"] }).then(res => {
            if (res.canceled)
                return

            if (res.filePaths.length < 1)
                return dialog.showMessageBox(win, {
                    type: "error",
                    title: "Error code : 138",
                    message: "ensure you select a folder contains greater than 1 files.",
                    buttons: [ "OK" ]
                })
            
            const folderPath = res.filePaths[0]
            const folderStat = fs.statSync(folderPath)

            if (!folderStat.isDirectory())
                return dialog.showMessageBox(win, {
                    type: "error",
                    title: "Error code : 212",
                    message: "please select a directory not a file",
                    buttons: [ "OK" ]
                })
            
            const folderFiles = fs.readdirSync(folderPath, { encoding: "utf-8" })

            var ret = []

            splitted = folderPath.split("/")
            pTitle = splitted[splitted.length - 2] + " / " + splitted[splitted.length - 1]

            for (let i = 0; i < folderFiles.length; i++) {
                file = folderFiles[i]
                file_dir = path.join(folderPath, file)
                fext = path.extname(file).replace(".", "").toLocaleLowerCase()
                fname = file.replace(fext, "")

                if (typeof fname === "string") {
                    onlyNumbers = fname.match(/\d+/g)
                    if (onlyNumbers)
                        fname = onlyNumbers.join("")
                }
                
                if (!supported_exts.includes(fext))
                    return dialog.showMessageBox(win, {
                        type: "error",
                        title: "Error code : 712",
                        message: "file type is not supported, supported files: " + supported_exts.join(", "),
                        buttons: [ "OK" ]
                    })

                ret[fname] = file_dir
            }

            ret.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
            
            win.loadFile(
                path.join("src", "read.html")
            ).then(() => {
                event.sender.send("renderImages", { filePath: folderPath, images: ret, pageTitle: pTitle })
            })
        })
    })
}

Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
        label: app.getName(),
        submenu: [
            { label: "Website", click: async () => { await shell.openExternal("https://bycat.one/") } },
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideothers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" }
        ]
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    { role: "help" }
]))

ipcMain.on("appVersion", event => {
    event.sender.send("appVersion", app.getVersion())
})

app.on("ready", createWindow)
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0)
        createWindow()
})
app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit()
})