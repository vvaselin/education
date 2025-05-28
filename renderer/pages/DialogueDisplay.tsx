import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Image,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spacer,
  HStack,
  Badge,
  Button, // MenuButtonのas={Button}で必要
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons';

// DialogueDisplayコンポーネントが受け取るProps（設計図）の型を定義
interface DialogueDisplayProps {
  tabData: Array<{ // tabDataの型を具体的に
    keyword: string;
    dialogues: Array<{ speaker: string; text: string }>;
  }>;
  activeTab: number;
  dialogueIndexes: number[];
  onTabChange: (index: number) => void;
  onDialogueIndexChange: (tabIndex: number, newDialogueIndex: number) => void;
  onAddNewTopic: () => void; // 新規タブ追加用の関数もPropsで受け取る
}

export default function DialogueDisplay({
  tabData,
  activeTab,
  dialogueIndexes,
  onTabChange,
  onDialogueIndexChange,
  onAddNewTopic, // 受け取った関数を使う
}: DialogueDisplayProps) {
  const imageSize = useBreakpointValue({ base: '80px', md: '100px' });
  const fontSize = useBreakpointValue({ base: 'md', md: 'xl' });
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  // 現在選択されているタブのデータを取得 (home.tsxから移動)
  const currentTabData = tabData[activeTab];
  const currentDialogueIndex = dialogueIndexes[activeTab];
  let currentDialogue;
  if (currentTabData && currentTabData.dialogues) { // currentTabData と dialogues が存在するかチェック！
    if (currentDialogueIndex >= 0 && currentDialogueIndex < currentTabData.dialogues.length) {
      currentDialogue = currentTabData.dialogues[currentDialogueIndex];
    } else {
      // dialogueIndexes[activeTab] が不正な場合のフォールバック
      console.warn(`Invalid dialogueIndex: ${currentDialogueIndex} for activeTab: ${activeTab}`);
      currentDialogue = { speaker: '', text: '会話の取得に失敗しました。' }; 
    }
  } else {
    // currentTabData が取得できない場合のフォールバック
    console.warn(`currentTabData is undefined for activeTab: ${activeTab}`);
    currentDialogue = { speaker: '', text: 'トピックの取得に失敗しました。' };
  }

  // 吹き出しの高さを測定して、キャラクターの位置を調整 (home.tsxから移動)
  useEffect(() => {
    if (bubbleRef.current) {
      setBubbleHeight(bubbleRef.current.offsetHeight);
    }
  }, [dialogueIndexes, activeTab, currentDialogue]); // currentDialogueも依存配列に追加

  // キャラクターの位置を吹き出しの高さに基づいて計算 (home.tsxから移動)
  const calculateCharacterTopPosition = () => {
    const basePosition = 170;
    const bubbleAdjustment = Math.max(0, bubbleHeight - 60) * 1.0;
    return `${basePosition - bubbleAdjustment}px`;
  };

  return (
    <Box
      flex="3.5" // このBoxが左側のメインになる
      bg="gray.200"
      display="flex"
      flexDirection="column"
      p={2}
      height="100%"
      overflowY="auto"
      justifyContent="flex-start"
    >
      {/* ドロップダウン形式のタブ選択 */}
      <Box bg="white" p={2} rounded="md" mb={2}>
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="bold">解説トピック:</Text>
          <Menu placement="bottom-end">
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              colorScheme="teal"
              size="sm"
            >
              <HStack spacing={2}>
                <Text>{tabData[activeTab]?.keyword || 'トピック選択'}</Text>
                <Badge colorScheme="teal" variant="solid" borderRadius="full">
                  {tabData[activeTab]?.dialogues.length || 0}
                </Badge>
              </HStack>
            </MenuButton>
            <MenuList maxH="400px" overflowY="auto">
              {tabData.map((tab, index) => (
                <MenuItem
                  key={index}
                  onClick={() => onTabChange(index)} // Propsで受け取った関数を使用
                  fontWeight={activeTab === index ? 'bold' : 'normal'}
                  bg={activeTab === index ? 'teal.50' : 'transparent'}
                >
                  <HStack justify="space-between" width="full">
                    <Text>{tab.keyword}</Text>
                    <Badge colorScheme="teal" variant="solid" borderRadius="full">
                      {tab.dialogues.length}
                    </Badge>
                  </HStack>
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuItem
                icon={<AddIcon />}
                onClick={onAddNewTopic} // Propsで受け取った関数を使用
              >
                新規タブ追加
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      {/* コンテンツ表示エリア */}
      {tabData.map((tab, tabIndex) => (
        <Box
          key={tabIndex}
          display={activeTab === tabIndex ? 'flex' : 'none'}
          flexDirection="column"
          // height="450px" // 高さは親要素に任せるか、flexで調整
          flex="1" // このBoxが残りのスペースを埋めるように
        >
          <Box
            bg="gray.500"
            rounded="lg"
            shadow="md"
            p={3}
            width="100%"
            flex="1" // このBoxも残りのスペースを埋める
            minHeight="300px" // 最低限の高さを確保
            display="flex"
            flexDirection="column"
            overflowY="hidden" // スクロールは親のBoxで行うため、ここはhidden
            justifyContent="space-between"
            position="relative"
          >
            {/* キャラクターたち */}
            <Flex /* ... (キャラクター表示のFlexはそのままコピー) ... */ >
              <Flex direction="column" align="center" position="absolute" left="5px" top={calculateCharacterTopPosition()} transition="top 0.3s ease">
                <Image src="/images/expert.png" alt="熟練者キャラ" boxSize={imageSize} objectFit="contain" />
                <Text fontWeight="bold" fontSize="xs">熟練者</Text>
              </Flex>
              <Flex direction="column" align="center" position="absolute" right="5px" top={calculateCharacterTopPosition()} transition="top 0.3s ease">
                <Image src="/images/beginner.png" alt="初心者キャラ" boxSize={imageSize} objectFit="contain" />
                <Text fontWeight="bold" fontSize="xs">初心者</Text>
              </Flex>
            </Flex>
            <Spacer />
            {/* 吹き出し */}
            <Box ref={bubbleRef} /* ... (吹き出しのBoxはそのままコピー、ただしtabIndexの条件は削除) ... */ 
                position="relative" bg="white" p={1} rounded="lg" shadow="sm" width="100%" mx="auto" display="flex" alignItems="center" justifyContent="center"
                _before={{
                    content: "''", position: 'absolute', bottom: '100%',
                    left: currentDialogue?.speaker === 'expert' ? '9%' : '91%', // currentDialogueを使う
                    transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '10px solid #FFFFFF',
                }}
                mb={4}
            >
              <Text fontSize={fontSize} fontWeight="bold" textAlign="center" whiteSpace="pre-wrap" wordBreak="break-word" p={1}>
                {currentDialogue?.text || ''}
              </Text>
            </Box>
            {/* スライダー */}
            <Box width="100%" maxW="60%" mb={2} mx="auto">
              <Slider
                aria-label="セリフスライダー"
                min={0}
                max={(currentTabData?.dialogues.length || 1) - 1} // 存在確認
                step={1}
                value={currentDialogueIndex}
                onChange={(val) => onDialogueIndexChange(activeTab, val)} // Propsで受け取った関数を使用
                isDisabled={!currentTabData} // データがない場合は無効化
              >
                <SliderTrack bg="teal.100" h="5px"><SliderFilledTrack bg="teal.400" /></SliderTrack>
                <SliderThumb boxSize={3} />
              </Slider>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}