import React, { useState } from 'react';
import { Box, Flex, Image, Text, Button } from '@chakra-ui/react';
import { motion } from 'framer-motion'; // アニメーション用にインポート

// セリフの型を定義
interface DialogueLine {
  character: string; // キャラクター名
  text: string;      // セリフ
  sprite: string;    // 立ち絵画像のパス
}

// このコンポーネントが受け取るPropsの型を定義
interface NovelViewProps {
  script: DialogueLine[]; // セリフのスクリプト
  onClose: () => void;    // このビューを閉じるための関数
}

export default function NovelView({ script, onClose }: NovelViewProps) {
  // 現在表示しているセリフのインデックスを管理するstate
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const currentLine = script[currentLineIndex];

  const handleNextLine = () => {
    // 次のセリフがあればインデックスを進める
    if (currentLineIndex < script.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
    } else {
      // スクリプトが終わったら閉じる
      onClose();
    }
  };

  return (
    // ★ 1. 画面全体を覆う半透明の背景
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
      bg="rgba(255, 255, 255, 0.7)" // 半透明の白
      zIndex={1300} // 他の要素より手前に表示
      justifyContent="center"
      alignItems="center"
      onClick={handleNextLine} // 画面クリックで次に進む
    >
      {/* キャラクターとセリフボックス全体のコンテナ */}
      <Box position="relative" width="80%" height="80%">
        
        {/* ★ 2. キャラクターの立ち絵 */}
        <motion.div
          key={currentLine.sprite} // 画像が変わるたびにアニメーション
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={currentLine.sprite}
            alt="character"
            position="absolute"
            bottom="0"
            left="50%"
            transform="translate(200%, -100%)"
            translateY={-50}
            maxHeight="90%"
            objectFit="contain"
          />
        </motion.div>

        {/* ★ 3. セリフボックス */}
        <Box
          position="absolute"
          bottom="5%"
          left="10%"
          right="10%"
          bg="rgba(0, 0, 0, 0.8)" // 少し透明な黒
          color="white"
          p={6}
          borderRadius="lg"
          boxShadow="lg"
        >
          <Text fontWeight="bold" fontSize="xl" mb={2}>{currentLine.character}</Text>
          <Text fontSize="lg">{currentLine.text}</Text>
        </Box>

      </Box>
    </Flex>
  );
}