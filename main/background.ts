import path from 'path'
import { app, ipcMain, BrowserWindow } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { spawn, exec, ChildProcess } from 'child_process'
import http from 'http'


const isProd = process.env.NODE_ENV === 'production'

let pythonServerProcess: ChildProcess | null = null;

function startPythonServer() {
  if (isProd) {
    // 本番環境用のロジック（これは後で実装）
    const serverPath = path.join(process.resourcesPath, 'fastapi_server.exe');
    pythonServerProcess = spawn(serverPath);
  } else {
    // 開発環境：仮想環境内のpython.exeを直接実行する
    const pythonExecutable = path.join(app.getAppPath(), 'rag-engine', '.venv', 'Scripts', 'python.exe');
    const command = `"${pythonExecutable}" -m uvicorn main:app --reload --port 8000`; // 実行するコマンド文字列

    // ★ spawn の代わりに exec を使用
    pythonServerProcess = exec(command, {
      cwd: path.join(app.getAppPath(), 'rag-engine'), // 実行ディレクトリを指定
    }, (error, stdout, stderr) => {
      // exec はプロセス終了時に一度だけコールバックされる
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
    });
  }

  // stdout（標準出力）とstderr（標準エラー出力）をリアルタイムでコンソールに表示
  if (pythonServerProcess) {
    pythonServerProcess.stdout?.on('data', (data) => {
      console.log(`Python Server: ${data.toString()}`);
    });
    pythonServerProcess.stderr?.on('data', (data) => {
      console.error(`Python Server Stderr: ${data.toString()}`);
    });
    pythonServerProcess.on('close', (code) => {
      console.log(`Python server process exited with code ${code}`);
    });
  }
}

// ★ ヘルスチェックと通知を行う関数
function checkServerAndNotify(window: BrowserWindow) {
  const healthCheckUrl = 'http://localhost:8000/health';
  const interval = setInterval(async () => { // asyncを追加
    try { // tryを追加
      const res = await fetch(healthCheckUrl); // awaitを追加
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

;(async () => {
  await app.whenReady()

  startPythonServer();

  const mainWindow = createWindow('main', {
    width: 1280,
    height: 720,
    resizable: false,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  checkServerAndNotify(mainWindow);

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2];
    const url = `http://localhost:${port}/home`;

    // サーバーが準備完了するまで待機する関数
    const waitForServer = async () => {
      for (let i = 0; i < 60; i++) { // 最大60秒待つ
        try {
          // Promiseを使ってhttp.getを非同期処理にする
          await new Promise((resolve, reject) => {
            http.get(url, (res) => {
              // ステータスコードが200なら成功
              if (res.statusCode === 200) {
                resolve(res.statusCode);
              } else {
                reject(new Error(`サーバーエラー: ${res.statusCode}`));
              }
            }).on('error', (err) => reject(err));
          });
          // 成功したらループを抜ける
          console.log('Next.js server is ready!');
          return;
        } catch (error) {
          console.log('Next.js server not ready yet. Retrying in 1s...');
          // 1秒待ってからリトライ
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      // タイムアウトした場合
      throw new Error('Timed out waiting for Next.js server.');
    };

    try {
      // サーバーの準備を待つ
      await waitForServer();
      // 準備ができたらURLを読み込む
      await mainWindow.loadURL(url);
    } catch (e) {
      console.error(e);
      // ここでエラーページをロードしたり、アプリを終了させたりすることも可能
    }
    // 開発ツールを開く
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

ipcMain.handle('run-cpp-code', async (event, cppCode: string) => {
  /*
  console.log('メインプロセス: C++コードを受け取ったよ！');
  const tempDir = path.join(app.getPath('temp'), 'cpp_executions');
  const cppFilePath = path.join(tempDir, `temp_code_${Date.now()}.cpp`);
  const exeFilePath = path.join(tempDir, `temp_code_${Date.now()}.exe`); // Windowsの場合.exe, Linux/macOSは拡張子なしでも

  try {
    // 一時ディレクトリを作成 (存在しない場合)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 1. C++コードを一時ファイルに保存
    fs.writeFileSync(cppFilePath, cppCode);
    console.log(`メインプロセス: C++ファイルを保存したよ -> ${cppFilePath}`);

    // 2. C++コードをコンパイル (g++ を使う例)
    //    ユーザーの環境にg++がインストールされていて、パスが通っている必要があるよ！
    const compileCommand = `g++ "${cppFilePath}" -o "${exeFilePath}" -std=c++17`; // 例: C++17でコンパイル
    
    console.log(`メインプロセス: コンパイル開始... コマンド: ${compileCommand}`);
    await new Promise<void>((resolve, reject) => {
      exec(compileCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`メインプロセス: コンパイルエラー！`, stderr);
          reject(new Error(`コンパイルエラー:\n${stderr}`));
          return;
        }
        console.log(`メインプロセス: コンパイル成功！ -> ${exeFilePath}`);
        resolve();
      });
    });

    // 3. コンパイルしたプログラムを実行
    console.log(`メインプロセス: プログラム実行開始... コマンド: "${exeFilePath}"`);
    const executionResult = await new Promise<string>((resolve, reject) => {
      exec(`"${exeFilePath}"`, (error, stdout, stderr) => {
        // 実行後に一時ファイルを削除
        fs.unlinkSync(cppFilePath);
        fs.unlinkSync(exeFilePath);
        console.log('メインプロセス: 一時ファイルを削除したよ');

        if (error) {
          // 実行時エラーもstderrに出ることがある
          console.error(`メインプロセス: 実行時エラー！`, stderr || error.message);
          reject(new Error(`実行時エラー:\n${stderr || error.message}`));
          return;
        }
        console.log(`メインプロセス: プログラム実行成功！ 出力:\n${stdout}`);
        resolve(stdout);
      });
    });

    return { success: true, output: executionResult };

  } catch (e) {
    // もし途中で何かエラーが起きたら、それをレンダラープロセスに返す
    console.error('メインプロセス: 予期せぬエラー！', e);
    // エラー時も一時ファイルがあれば削除しようと試みる
    if (fs.existsSync(cppFilePath)) fs.unlinkSync(cppFilePath);
    if (fs.existsSync(exeFilePath)) fs.unlinkSync(exeFilePath);
    return { success: false, error: e.message };
  }
  */
});