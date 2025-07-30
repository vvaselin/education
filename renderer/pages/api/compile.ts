// renderer/pages/api/compile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

import dotenv from 'dotenv';
// .env.localの場所を明示的に指定
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '..', '.env.local') });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'C++ code is required.' });
  }

  const emsdkPath = process.env.EMSDK_PATH;

  if (!emsdkPath) {
    console.error('サーバー環境変数エラー: EMSDK_PATHが設定されていません。.env.localファイルを確認してください。');
    return res.status(500).json({ 
      error: 'サーバー環境変数エラー: EMSDK_PATHが設定されていません。.env.localファイルを確認してください。' 
    });
  }

  const emsdkEnvScript = path.join(emsdkPath, 'emsdk_env.bat');

  // 【修正点1】プロジェクトルートへのパスを正しく修正
  // /renderer/.next/server/pages/api から5階層上がる
  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..', '..');
  const tempDir = path.join(projectRoot, 'temp_compile');
  
  const uniqueId = `code_${Date.now()}`;
  const cppFilePath = path.join(tempDir, `${uniqueId}.cpp`);
  const jsFilePath = path.join(tempDir, `${uniqueId}.js`);

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(cppFilePath, code);

    // 【修正点2】コマンドの組み立て方をシンプルで安全な方法に変更
    // 各パスをダブルクォートで囲み、&& でつなぐ
    const commandToRun = `"${emsdkEnvScript}" && emcc "${cppFilePath}" -o "${jsFilePath}" -s MODULARIZE=1 -s EXPORT_NAME="'createCppWasmModule'" -s ENVIRONMENT='web' -s SINGLE_FILE=1`;
    
    console.log('Executing command:', commandToRun);

    await new Promise<void>((resolve, reject) => {
      // execがデフォルトで cmd.exe を使うので、コマンドを直接渡す
      exec(commandToRun, { encoding: 'utf8', timeout: 20000 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Execution error:`, error);
          const errorMessage = `コンパイルエラー:\n${stderr || error.message}`;
          reject(new Error(errorMessage));
          return;
        }
        
        fs.readFile(jsFilePath, 'utf-8')
          .then(jsContent => {
            res.setHeader('Content-Type', 'application/javascript');
            res.status(200).send(jsContent);
            resolve();
          })
          .catch(readError => reject(readError));
      });
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    // 一時ファイルを削除
    try {
      await fs.unlink(cppFilePath);
      if (await fs.stat(jsFilePath).catch(() => false)) {
        await fs.unlink(jsFilePath);
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup temp files:", cleanupError);
    }
  }
}
