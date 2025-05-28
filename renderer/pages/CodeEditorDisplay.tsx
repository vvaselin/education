import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Box, Button, VStack, Text, useToast } from '@chakra-ui/react';

interface CodeEditorDisplayProps {
  initialCode?: string;
  language?: string;
}

export default function CodeEditorDisplay({
  initialCode = "// C++のコードをここに書こう！\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello, C++ from Nextron!\" << std::endl;\n    return 0;\n}",
  language = "cpp", // C++なので 'cpp' を指定
}: { initialCode?: string; language?: string; }) {
  const [code, setCode] = useState<string | undefined>(initialCode);
  const [output, setOutput] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState(false);
  const toast = useToast();
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // コンポーネントがアンマウントされるときに、追加したscriptタグを削除
    return () => {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    setCode(value);
  };

  const handleRunCode = async () => {
    if (!code) {
      setOutput("コードが空です。");
      return;
    }
    if (isCompiling) return;

    setIsCompiling(true);
    setOutput("Emscriptenでコンパイル中...");

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || '不明なコンパイルエラーです。');
        } catch (e) {
          console.error("Server response (not JSON):", errorText);
          throw new Error(`サーバーエラー: ${response.status} ${response.statusText}`);
        }
      }

      const wasmJs = await response.text();
      
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
      }
      
      setOutput("コンパイル成功！ Wasmモジュールをロード・実行中...");
      
      const script = document.createElement('script');
      script.text = wasmJs;
      document.body.appendChild(script);
      scriptRef.current = script;

      // ブラウザがスクリプトを解釈するのを少しだけ待つ
      await new Promise(res => setTimeout(res, 100));

      if (typeof (window as any).createCppWasmModule !== 'function') {
        throw new Error('Wasmローダースクリプトの初期化に失敗しました。「createCppWasmModule」関数が見つかりません。');
      }

      let executionOutput = "";
      const outputCollector = (text: string) => {
        executionOutput += text + '\n';
      };

      // Wasmモジュールを初期化。この時点でC++のmain関数が実行される
      await (window as any).createCppWasmModule({
        print: outputCollector,
        printErr: outputCollector,
      });
      
      // main関数の実行が完了し、収集された出力を表示
      setOutput("実行結果:\n" + (executionOutput || "（出力はありませんでした）"));

    } catch (error) {
      console.error("コンパイル/実行エラー:", error);
      setOutput(`エラー:\n${error.message}`);
      toast({
        title: "エラーが発生しました",
        description: error.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <Box flex="3.5" height="100%" display="flex" flexDirection="column" bg="gray.800" minWidth="0">
      <Editor
        height="70%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: true },
          fontSize: 18,
          wordWrap: 'on',
        }}
      />
      <VStack p={2} spacing={2}>
        <Button
          colorScheme="green"
          onClick={handleRunCode}
          width="100%"
          isLoading={isCompiling}
          loadingText="コンパイル中..."
        >
          コードを実行 (Wasm)
        </Button>
        <Box
          width="100%"
          height="100%"
          bg="gray.900"
          p={2}
          rounded="md"
          overflowY="auto"
          fontSize="sm"
          whiteSpace="pre-wrap"
          fontFamily="monospace"
          color="white"
        >
          <Text as="pre">{output}</Text>
        </Box>
      </VStack>
    </Box>
  );
}