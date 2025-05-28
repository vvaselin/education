// renderer/pages/api/compile.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'C++ code is required.' });
  }

  // --- ★★★ 新しいアプローチ ★★★ ---
  // ご自身のPCのemsdkフォルダへの絶対パスを指定します。
  const emsdkPath = "C:\\Users\\rinwa\\Desktop\\programing\\emsdk"; 
  const emsdkEnvScript = path.join(emsdkPath, 'emsdk_env.bat');

  const tempDir = path.join(process.cwd(), 'temp_compile');
  const uniqueId = `code_${Date.now()}`;
  const cppFilePath = path.join(tempDir, `${uniqueId}.cpp`);
  const jsFilePath = path.join(tempDir, `${uniqueId}.js`);

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(cppFilePath, code);

    // emsdk_env.bat を実行してから emcc を実行するコマンドを組み立てます
    const compileCommand = `emcc "${cppFilePath}" -o "${jsFilePath}" -s MODULARIZE=1 -s EXPORT_NAME="'createCppWasmModule'" -s ENVIRONMENT='web' -s SINGLE_FILE=1`;
    const fullCommand = `"${emsdkEnvScript}" && ${compileCommand}`;
    
    console.log('Executing command:', fullCommand);

    await new Promise<void>((resolve, reject) => {
      // タイムアウトを少し延長 (初回コンパイルは時間がかかるため)
      exec(fullCommand, { encoding: 'utf8', timeout: 20000 }, (error, stdout, stderr) => {
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
      // statでファイルの存在を確認してからunlink
      if (await fs.stat(jsFilePath).catch(() => false)) {
          await fs.unlink(jsFilePath);
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup temp files:", cleanupError);
    }
  }
}