import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box, Button, VStack, Text, useToast,
  Tabs, TabList, Tab, TabPanels, TabPanel, Flex
} from '@chakra-ui/react';
import { VscTerminalPowershell } from 'react-icons/vsc';

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
      
      if (iframeRef.current) {
        document.body.removeChild(iframeRef.current);
      }

      setOutput("コンパイル成功！ Wasmモジュールをロード・実行中...");
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframeRef.current = iframe;

      const resultPromise = new Promise<string>((resolve, reject) => {
        const messageListener = (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return;
          if (event.data.type === 'wasm_output') {
            resolve(event.data.output);
          } else if (event.data.type === 'wasm_error') {
            reject(new Error(event.data.error));
          }
          window.removeEventListener('message', messageListener);
        };
        window.addEventListener('message', messageListener);

        setTimeout(() => {
          window.removeEventListener('message', messageListener);
          reject(new Error("Wasm実行がタイムアウトしました。"));
        }, 15000);
      });

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
              window.parent.postMessage({ type: 'wasm_output', output: output }, '*');
            }).catch(err => {
              window.parent.postMessage({ type: 'wasm_error', error: err.message }, '*');
            });
          </script>
        </body></html>
      `;
      
      iframe.srcdoc = iframeHtml;
      
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
      <Tabs variant="enclosed-colored" colorScheme="gray" display="flex" flexDirection="column" flex="1" minHeight="0">
        
        {/* タブのヘッダー部分 */}
        <TabList>
          <Tab _selected={{ color: 'white', bg: 'gray.800' }}>
            <Flex align="center">
              <Box as={VscTerminalPowershell} color="blue.300" mr={2} /> {/* アイコン */}
              <Text>main.cpp</Text> {/* ファイル名 */}
            </Flex>
          </Tab>
        </TabList>

        {/* タブのコンテンツ部分 */}
        <TabPanels bg="gray.800" flex="1" display="flex" flexDirection="column" minHeight="0">
          <TabPanel p={0} flex="1" display="flex" flexDirection="column" minHeight="0">

            {/* Editor本体 (高さを親要素に合わせるためBoxで囲む) */}
            <Box flex="1" minHeight="0">
              <Editor
                height="100%"
                language={"cpp"}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                  selectOnLineNumbers: true,
                  minimap: { enabled: true },
                  fontSize: 17,
                  wordWrap: 'on',
                }}
              />
            </Box>

            {/* ボタンと実行結果エリア */}
            <VStack p={2} spacing={2} bg="gray.800">
              <Button colorScheme="green" onClick={handleRunCode} width="100%" isLoading={isCompiling}>
                コードを実行 (Wasm)
              </Button>
              <Box
                width="100%"
                height="120px"
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

          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}