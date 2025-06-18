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
    console.log('Starting Python RAG server...');
    console.log('Python executable:', pythonExecutable);
    console.log('Working directory:', ragEngineDir);

    const command = `"${pythonExecutable}" -m uvicorn main_qdrant:app --reload --port 8000 --host 0.0.0.0`;
    const pythonServerProcess = exec(command, {
      cwd: ragEngineDir,
      env: { ...process.env, PYTHONPATH: ragEngineDir }
    });

    pythonServerProcess.stdout?.on('data', (data) => {
      console.log(`Python Server: ${data.toString().trim()}`);
    });

    pythonServerProcess.stderr?.on('data', (data) => {
      const errorMsg = data.toString().trim();
      // 通常の起動メッセージは無視
      if (!errorMsg.includes('INFO:') && !errorMsg.includes('Uvicorn running')) {
        console.error(`Python Server Error: ${errorMsg}`);
      }
    });

    pythonServerProcess.on('error', (error) => {
      console.error('Failed to start Python server:', error);
    });

    pythonServerProcess.on('exit', (code, signal) => {
      console.log(`Python server exited with code ${code} and signal ${signal}`);
    });

    app.on('will-quit', () => {
      console.log('Killing Python server...');
      pythonServerProcess.kill();
    });
  } else {
    console.log('Python executable not found or production mode:', pythonExecutable);
  }

  const healthCheckUrl = 'http://localhost:8000/health';
  let retryCount = 0;
  const maxRetries = 30; // 最大60秒待機

  const interval = setInterval(async () => {
    try {
      const res = await fetch(healthCheckUrl, { timeout: 5000 });
      if (res.ok) {
        const data = await res.json();
        console.log('FastAPI server is ready!', data);
        window.webContents.send('fastapi-ready');
        clearInterval(interval);
      }
    } catch (e) {
      retryCount++;
      console.log(`Waiting for FastAPI server... (${retryCount}/${maxRetries})`);

      if (retryCount >= maxRetries) {
        console.error('FastAPI server failed to start within timeout');
        clearInterval(interval);
        window.webContents.send('fastapi-error', 'サーバーの起動に失敗しました');
      }
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