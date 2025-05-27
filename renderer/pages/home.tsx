import dynamic from 'next/dynamic';
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import KeywordList from './KeywordList';
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
  Select,
  Badge,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Spacer,
  HStack,
  useDisclosure, 
  Modal,         
  ModalOverlay,  
  ModalContent,  
  ModalHeader,   
  ModalBody,     
  ModalCloseButton, 
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons';

const PhaserGame = dynamic(() => import('../components/PhaserGame'), {
  ssr: false, // これが「サーバーでは読み込まないでね」っていうおまじない！
  loading: () => <p>ゲームを読み込み中...</p> // ローディング表示もできるよ
});

// キーワードごとに解説データを管理
const tabData = [
  {
    keyword: "基本操作",
    dialogues: [
      { speaker: 'beginner', text: 'ここってどうやるの？' },
      { speaker: 'expert', text: 'こうやるのじゃ！' },
      { speaker: 'beginner', text: 'なるほど、ありがとう！' },
      { speaker: 'expert', text: 'いつでも聞くんじゃぞ！' },
    ]
  },
  {
    keyword: "応用テクニック",
    dialogues: [
      { speaker: 'beginner', text: '応用的な使い方を教えて！' },
      { speaker: 'expert', text: 'まずはこのボタンを押してみるのじゃ' },
      { speaker: 'beginner', text: 'わかった！それで次は？' },
      { speaker: 'expert', text: '次にこの機能を使うと効率的は' },
    ]
  },
  {
    keyword: "トラブルシューティング",
    dialogues: [
      { speaker: 'beginner', text: 'エラーが出ちゃった...' },
      { speaker: 'expert', text: 'よくあるケースじゃの。こちらを確認してみるのじゃ' },
      { speaker: 'beginner', text: '確認したら直ったよ！' },
      { speaker: 'expert', text: '素晴らしい！次からは自分で解決できるのう' },
    ]
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [dialogueIndexes, setDialogueIndexes] = useState(tabData.map(() => 0));
  const imageSize = useBreakpointValue({ base: '80px', md: '100px' });
  const fontSize = useBreakpointValue({ base: 'md', md: 'xl' });
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const bubbleRef = useRef(null);

  // 現在選択されているタブのデータを取得
  const currentTabData = tabData[activeTab];
  const currentDialogueIndex = dialogueIndexes[activeTab];
  const currentDialogue = currentTabData.dialogues[currentDialogueIndex];

  // 特定タブのダイアログインデックスを更新
  const updateDialogueIndex = (tabIndex, newDialogueIndex) => {
    const newIndexes = [...dialogueIndexes];
    newIndexes[tabIndex] = newDialogueIndex;
    setDialogueIndexes(newIndexes);
  };

  // タブ変更ハンドラー
  const handleTabChange = (event) => {
    setActiveTab(parseInt(event.target.value));
  };

  // 吹き出しの高さを測定して、キャラクターの位置を調整
  useEffect(() => {
    if (bubbleRef.current) {
      setBubbleHeight(bubbleRef.current.offsetHeight);
    }
  }, [dialogueIndexes, activeTab]);

  // キャラクターの位置を吹き出しの高さに基づいて計算
  const calculateCharacterTopPosition = () => {
    const basePosition = 170;
    // 吹き出しの高さが基準値を超えたら、その分上に移動
    const bubbleAdjustment = Math.max(0, bubbleHeight - 60) * 1.0;
    return `${basePosition - bubbleAdjustment}px`;
  };

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Head>
        <title>EduApp</title>
        <style jsx global>{`
          html, body {
            overflow: hidden;
            margin: 0;
            padding: 0;
          }
          #__next {
            width: 896px;
            height: 504px;
            margin: 0 auto;
            overflow: hidden;
          }
        `}</style>
      </Head>
      
      <Box width="896px" height="504px" margin="0 auto" overflow="hidden">
        <Flex direction="row" height="100%" width="100%">
          {/* 左側（解説画面） */}
          <Box
            flex="3.5"
            bg="gray.200" 
            display="flex"
            flexDirection="column"
            p={2}
            height="100%"
            overflowY="auto"
            justifyContent="flex-start"
          > 
            {/* ドロップダウン形式のタブ選択 - 右寄せ */}
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
                    <Text>{tabData[activeTab].keyword}</Text>
                    <Badge colorScheme="teal" variant="solid" borderRadius="full">
                      {tabData[activeTab].dialogues.length}
                    </Badge>
                  </HStack>
                </MenuButton>
                <MenuList maxH="400px" overflowY="auto">
                  {tabData.map((tab, index) => (
                    <MenuItem 
                      key={index}
                      onClick={() => setActiveTab(index)}
                      fontWeight={activeTab === index ? "bold" : "normal"}
                      bg={activeTab === index ? "teal.50" : "transparent"}
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
                    onClick={() => {
                      alert('この機能はまだ実装中です。メモから新しいタブを生成します。');
                    }}
                  >
                    新規タブ追加
                  </MenuItem>
                </MenuList>
              </Menu>
              </Flex>
            </Box>

            {/* Phaserゲームコンポーネント */}
            <Button colorScheme="orange" onClick={onOpen} mb={2}>
              ゲームで遊ぶ！
            </Button>

            {/* コンテンツ表示エリア */}
            {tabData.map((tab, tabIndex) => (
              <Box 
                key={tabIndex}
                display={activeTab === tabIndex ? "flex" : "none"}
                flexDirection="column"
                height="450px"
              >
                <Box 
                  bg="gray.500" 
                  rounded="lg" 
                  shadow="md" 
                  p={3} 
                  width="100%" 
                  flex="1"
                  minHeight="300px"
                  display="flex"
                  flexDirection="column"
                  overflowY="auto"
                  justifyContent="space-between"
                  position="relative"
                >
                  {/* キャラクターたち - 位置を動的に調整 */}
                  <Flex 
                    w="100%" 
                    mx="auto" 
                    justify="space-between" 
                    align="center" 
                    mb={4}
                    position="relative"
                    px={2}
                  >
                    {/* 左端 - 熟練者 */}
                    <Flex 
                      direction="column" 
                      align="center" 
                      position="absolute" 
                      left="5px" 
                      top={calculateCharacterTopPosition()}
                      transition="top 0.3s ease"
                    >
                      <Image 
                        src="/images/expert.png" 
                        alt="熟練者キャラ" 
                        boxSize={imageSize}
                        objectFit="contain" 
                      />
                      <Text fontWeight="bold" fontSize="xs">熟練者</Text>
                    </Flex>
                    
                    {/* 右端 - 初心者 */}
                    <Flex 
                      direction="column" 
                      align="center" 
                      position="absolute" 
                      right="5px" 
                      top={calculateCharacterTopPosition()}
                      transition="top 0.3s ease"
                    >
                      <Image 
                        src="/images/beginner.png" 
                        alt="初心者キャラ" 
                        boxSize={imageSize}
                        objectFit="contain" 
                      />
                      <Text fontWeight="bold" fontSize="xs">初心者</Text>
                    </Flex>
                  </Flex>
                  
                  <Spacer />
                  
                  {/* 吹き出し */}
                  <Box
                    ref={tabIndex === activeTab ? bubbleRef : null}
                    position="relative"
                    bg="white"
                    p={1}
                    rounded="lg"
                    shadow="sm"
                    width="100%"
                    mx="auto"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _before={{
                      content: "''",
                      position: 'absolute',
                      bottom: '100%',
                      left: tab.dialogues[dialogueIndexes[tabIndex]].speaker === 'expert' ? '9%' : '91%',
                      transform: 'translateX(-50%)',
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderBottom: '10px solid #FFFFFF',
                    }}
                    mb={4}
                  >
                    <Text 
                      fontSize={fontSize}
                      fontWeight="bold" 
                      textAlign="center"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word" 
                      p={1}
                    >
                      {tab.dialogues[dialogueIndexes[tabIndex]].text}
                    </Text>
                  </Box>
                  
                  {/* スライダー */}
                  <Box width="100%" maxW="60%" mb={2} mx="auto">
                    <Slider
                      aria-label="セリフスライダー"
                      min={0}
                      max={tab.dialogues.length - 1}
                      step={1}
                      value={dialogueIndexes[tabIndex]}
                      onChange={(val) => updateDialogueIndex(tabIndex, val)}
                    >
                      <SliderTrack bg="teal.100" h="5px">
                        <SliderFilledTrack bg="teal.400" />
                      </SliderTrack>
                      <SliderThumb boxSize={3} />
                    </Slider>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* 右側（メモ帳） */}
          <Box flex="1" bg="white" p={4} height="100%">
            <KeywordList />
          </Box>
        </Flex>
      </Box>

      {/* ゲームのモーダル */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Phaser ゲーム</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {/* ここにゲームコンポーネントを召喚！ */}
            <PhaserGame />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}