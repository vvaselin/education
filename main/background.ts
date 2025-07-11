import path from 'path'
import { app, ipcMain, BrowserWindow } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { exec, ChildProcess } from 'child_process'
import fs from 'fs'
import fetch from 'node-fetch'

const isProd = process.env.NODE_ENV === 'production'

function startAndCheckServer(window: BrowserWindow) {
  const projectRoot = app.getAppPath();
  const ragEngineDir = path.join(projectRoot, 'rag-engine');
  const pythonExecutable = path.join(ragEngineDir, '.venv', 'Scripts', 'python.exe');

  if (!isProd && fs.existsSync(pythonExecutable)) {
    const command = `"${pythonExecutable}" -m uvicorn main:app --reload --port 8000`;
    const pythonServerProcess = exec(command, { cwd: ragEngineDir });

    pythonServerProcess.stdout?.on('data', (data) => console.log(`Python Server: ${data.toString()}`));
    pythonServerProcess.stderr?.on('data', (data) => console.error(`Python Server Stderr: ${data.toString()}`));

    app.on('will-quit', () => pythonServerProcess.kill());
  }

  const healthCheckUrl = 'http://localhost:8000/health';
  const interval = setInterval(async () => {
    try {
      const res = await fetch(healthCheckUrl);
      if (res.ok) {
        console.log('FastAPI server is ready!');
        window.webContents.send('fastapi-ready');
        clearInterval(interval);
      }
    } catch (e) {
      console.log('Waiting for FastAPI server...');
    }
  }, 2000);
}

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

; (async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1280,
    height: 720,
    resizable: false,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  const port = process.argv[2] || 8888;
  const loadingUrl = `http://localhost:${port}/loading`;
  await mainWindow.loadURL(loadingUrl);

  startAndCheckServer(mainWindow);
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('get-history', async () => {
  try {
    const res = await fetch('http://localhost:8000/history');
    if (!res.ok) throw new Error('Failed to fetch history from backend');
    return res.json();
  } catch (e) {
    console.error('Error in get-history handler:', e);
    return { error: e.message }; // エラー情報を返す
  }
});

ipcMain.handle('post-rag', async (event, message: string) => {
  try {
    const res = await fetch('http://localhost:8000/rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message }),
    });
    if (!res.ok) throw new Error('Failed to fetch RAG response from backend');
    return res.json();
  } catch (e) {
    console.error('Error in post-rag handler:', e);
    return { error: e.message }; // エラー情報を返す
  }
});

ipcMain.handle('get-favorability', async () => {
  try {
    const res = await fetch('http://localhost:8000/favorability');
    if (!res.ok) throw new Error('Failed to fetch favorability from backend');
    return res.json();
  } catch (e) {
    console.error('Error in get-favorability handler:', e);
    return { error: e.message };
  }
});

ipcMain.handle('update-favorability', async (event, delta: number) => {
  try {
    const res = await fetch('http://localhost:8000/favorability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: delta }),
    });
    if (!res.ok) throw new Error('Failed to update favorability on backend');
    return res.json();
  } catch (e) {
    console.error('Error in update-favorability handler:', e);
    return { error: e.message };
  }
});