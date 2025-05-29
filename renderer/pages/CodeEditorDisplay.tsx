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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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
        // ... (エラーハンドリングは変更なし)
      }

      const wasmJs = await response.text();
      
      // 以前のiframeが残っていれば削除
      if (iframeRef.current) {
        document.body.removeChild(iframeRef.current);
      }

      setOutput("コンパイル成功！ Wasmモジュールをロード・実行中...");
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none'; // 画面には表示しない
      document.body.appendChild(iframe);
      iframeRef.current = iframe;

      // iframeからの実行結果を待つPromise
      const resultPromise = new Promise<string>((resolve, reject) => {
        // iframeからのメッセージを受け取るリスナー
        const messageListener = (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return; // 送信元を確認
          
          if (event.data.type === 'wasm_output') {
            resolve(event.data.output);
          } else if (event.data.type === 'wasm_error') {
            reject(new Error(event.data.error));
          }
          window.removeEventListener('message', messageListener); // 処理後にリスナーを削除
        };
        window.addEventListener('message', messageListener);

        // タイムアウト処理
        setTimeout(() => {
          window.removeEventListener('message', messageListener);
          reject(new Error("Wasm実行がタイムアウトしました。"));
        }, 15000);
      });

      // iframe内に埋め込むHTMLコンテンツを作成
      const iframeHtml = `
        <html><body>
          <script>${wasmJs}</script>
          <script>
            let output = "";
            const outputCollector = (text) => { output += text + '\\n'; };
            
            createCppWasmModule({
              print: outputCollector,
              printErr: outputCollector,
            }).then(() => {
              // 成功したら親ウィンドウにメッセージを送信
              window.parent.postMessage({ type: 'wasm_output', output: output }, '*');
            }).catch(err => {
              // 失敗したら親ウィンドウにメッセージを送信
              window.parent.postMessage({ type: 'wasm_error', error: err.message }, '*');
            });
          </script>
        </body></html>
      `;
      
      // iframeにHTMLを書き込む
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(iframeHtml);
        iframeDoc.close();
      } else {
        throw new Error("Iframeの初期化に失敗しました。");
      }
      
      // iframeからの結果を待って表示
      const executionResult = await resultPromise;
      setOutput("実行結果:\n" + (executionResult || "（出力はありませんでした）"));

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