import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Button, VStack } from '@chakra-ui/react';

interface CodeEditorDisplayProps {
  initialCode?: string;
  language?: string;
}

export default function CodeEditorDisplay({
  initialCode = "// C++のコードをここに書こう！\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello, C++ from Nextron!\" << std::endl;\n    return 0;\n}",
  language = "cpp", // C++なので 'cpp' を指定
}: CodeEditorDisplayProps) {
  const [code, setCode] = useState<string | undefined>(initialCode);
  const [output, setOutput] = useState<string>('');

  // エディタの内容が変更されたときの処理
  const handleEditorChange = (value: string | undefined, event: any) => {
    setCode(value);
    // ここで書かれたコードをどこかに保存したり、実行したりする処理を後で追加できるよ！
    // console.log('Current code:', value);
  };

  const handleRunCode = async () => { // ★async を忘れずに！
    if (!code) {
      setOutput("コードが空っぽだよ！");
      return;
    }
    setOutput("コードを実行中...\n（初回はコンパイラが動くので少し時間がかかるかも！）");
    try {
      // ★メインプロセスの 'run-cpp-code' を呼び出して、コードを渡す！
      const result = await window.ipcRenderer.invoke('run-cpp-code', code);

      if (result.success) {
        setOutput("実行結果:\n" + result.output);
      } else {
        setOutput("エラー:\n" + result.error);
      }
    } catch (error) {
      console.error("IPC通信エラー:", error);
      setOutput("メインプロセスとの通信でエラーが起きたみたい…。\n" + String(error));
    }
  };

  return (
    <Box 
      flex="3.5" // home.tsxの左側パネルのサイズに合わせる
      height="100%" 
      display="flex" 
      flexDirection="column"
      // エディタなので背景色は暗めがいいかも。Chakraのテーマに合わせてもOK
      bg="gray.800" // VS Codeのダークテーマっぽい色
      minWidth="0"
      overflowY="auto"
    >
      <Editor
        height="100%" // 親のBoxいっぱいに広げる
        language={language}
        theme="vs-dark" // VS Codeでおなじみのダークテーマ
        value={code} // 表示するコード
        onChange={handleEditorChange} // コードが変更されたら呼ばれる
        options={{
          selectOnLineNumbers: true, // 行番号クリックで行選択
          minimap: { enabled: true },   // 右側のミニマップ表示
          fontSize: 14,                // フォントサイズ
          wordWrap: 'on',              // 自動で折り返し
        }}
      />
      <VStack /* ... */ >
        <Button colorScheme="green" onClick={handleRunCode} width="100%">
          コードを実行 (Ctrl+Enter もどき)
        </Button>
        <Box 
          width="100%" 
          height="80px" // 少し高さを増やしてみる
          bg="gray.900" 
          p={2} 
          rounded="md" 
          overflowY="auto"
          fontSize="sm"
          whiteSpace="pre-wrap"
          fontFamily="monospace" // 等幅フォントの方が見やすいかも
        >
          {output}
        </Box>
      </VStack>
    </Box>
  );
}