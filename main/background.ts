import path from 'path'
import { app, ipcMain, BrowserWindow } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { exec, ChildProcess } from 'child_process'
import fs from 'fs'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

// メインの非同期処理
;(async () => {
  await app.whenReady()

  // 1. Pythonサーバーを起動する
  const projectRoot = app.getAppPath();
  const ragEngineDir = path.join(projectRoot, 'rag-engine');
  const pythonExecutable = path.join(ragEngineDir, '.venv', 'Scripts', 'python.exe');

  if (!isProd && fs.existsSync(pythonExecutable)) {
    const command = `"${pythonExecutable}" -m uvicorn main:app --reload --port 8000`;
    const pythonServerProcess = exec(command, { cwd: ragEngineDir });

    pythonServerProcess.stdout?.on('data', (data) => console.log(`Python Server: ${data.toString()}`));
    pythonServerProcess.stderr?.on('data', (data) => console.error(`Python Server Stderr: ${data.toString()}`));

    app.on('will-quit', () => {
        pythonServerProcess.kill();
    });
  }

  // 2. Electronウィンドウを作成
  const mainWindow = createWindow('main', {
    width: 1280,
    height: 720,
    resizable: false,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })
  
  // 3. 最初にローディングページを表示
  const port = process.argv[2] || 8888;
  const loadingUrl = `http://localhost:${port}/loading`;
  const homeUrl = `http://localhost:${port}/home`;
  
  await mainWindow.loadURL(loadingUrl);

  // ★ 4. 単純に8秒待ってからメインページに遷移する
  console.log("Starting a 8-second timer before navigating to /home...");
  setTimeout(() => {
    console.log("Timer finished. Navigating to /home now.");
    mainWindow.loadURL(homeUrl);
  }, 8000); // 8000ミリ秒 = 8秒

})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})