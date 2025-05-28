import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Box } from '@chakra-ui/react';

interface CodeEditorDisplayProps {
  initialCode?: string;
  language?: string;
}

export default function CodeEditorDisplay({
  initialCode = "// C++のコードをここに書こう！\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello, C++ from Nextron!\" << std::endl;\n    return 0;\n}",
  language = "cpp", // C++なので 'cpp' を指定
}: CodeEditorDisplayProps) {
  const [code, setCode] = useState<string | undefined>(initialCode);

  // エディタの内容が変更されたときの処理
  const handleEditorChange = (value: string | undefined, event: any) => {
    setCode(value);
    // ここで書かれたコードをどこかに保存したり、実行したりする処理を後で追加できるよ！
    // console.log('Current code:', value);
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
    </Box>
  );
}