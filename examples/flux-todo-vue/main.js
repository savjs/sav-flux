const electron = require('electron')
const {app, BrowserWindow} = electron

var mainWindow = null

app.on('window-all-closed', function () {
  if (process.platform != 'darwin') {
    app.quit()
  }
})

app.on('ready', function () {
  mainWindow = new BrowserWindow({width: 1200, height: 800})
  mainWindow.webContents.toggleDevTools()
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  mainWindow.on('closed', function () {
    mainWindow = null
  })
})
