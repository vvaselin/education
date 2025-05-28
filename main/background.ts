import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import fs from 'fs';
import { exec } from 'child_process';

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
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

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
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
});