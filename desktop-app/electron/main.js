const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

let mainWindow = null
let pythonProcess = null

// Путь к Python-серверу
function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server')
  }
  return path.join(__dirname, '..', 'server')
}

// Путь к Python-исполняемому файлу
function getPythonPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', 'python.exe')
  }
  return 'python'
}

function startPythonServer() {
  const serverDir = getServerPath()
  const pythonExe = getPythonPath()
  const appScript = path.join(serverDir, 'app.py')

  console.log('Запуск Python-сервера:', appScript)

  pythonProcess = spawn(pythonExe, [appScript], {
    cwd: serverDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log('[server]', data.toString())
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error('[server error]', data.toString())
  })

  pythonProcess.on('exit', (code) => {
    console.log('Сервер завершён с кодом:', code)
  })
}

function waitForServer(url, retries, callback) {
  const http = require('http')
  http.get(url, () => {
    callback(null)
  }).on('error', () => {
    if (retries > 0) {
      setTimeout(() => waitForServer(url, retries - 1, callback), 500)
    } else {
      callback(new Error('Сервер не запустился'))
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Журнал успеваемости',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0f1117',
    show: false,
  })

  // Загружаем фронтенд
  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, 'frontend', 'index.html')
    : path.join(__dirname, '..', 'frontend', 'dist', 'index.html')

  mainWindow.loadFile(indexPath)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  startPythonServer()

  // Ждём пока сервер поднимется (до 15 секунд)
  waitForServer('http://localhost:8787/groups', 30, (err) => {
    if (err) {
      dialog.showErrorBox(
        'Ошибка запуска',
        'Не удалось запустить локальный сервер.\nПопробуйте перезапустить приложение.'
      )
    }
    createWindow()
  })
})

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
  app.quit()
})

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
})
