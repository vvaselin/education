import React, { useState } from 'react';
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
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  IconButton
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

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
  const imageSize = useBreakpointValue({ base: '120px', md: '170px' });
  const fontSize = useBreakpointValue({ base: 'md', md: '2xl' });

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

  return (
    <>
      <Head>
        <title>EduApp</title>
      </Head>
      <Flex direction="row" minHeight="100vh">
 
        {/* 左側（解説画面） */}
        <Box
          flex="3"
          bg="gray.200" 
          display="flex"
          flexDirection="column"
          p={4}
          height="100vh"
          overflowY="auto"
          justifyContent="flex-start" // 上揃えに変更
        >
          {/* タブ機能 - より軽量でモダンなデザインに */}
          <Tabs 
            variant="soft-rounded" 
            colorScheme="teal" 
            index={activeTab} 
            onChange={setActiveTab}
            bg="white"
            p={2}
            rounded="md"
            mb={2}
            size={useBreakpointValue({ base: "sm", md: "md" })}
            isLazy // パフォーマンス向上のため、現在表示されているタブのみレンダリング
          >
            <Flex align="center">
              <TabList overflowX="auto" flex="1">
                {tabData.map((tab, index) => (
                  <Tab key={index}>
                    <Text fontWeight="medium">{tab.keyword}</Text>
                    <Badge ml={2} colorScheme="teal" variant="solid" borderRadius="full">
                      {tab.dialogues.length}
                    </Badge>
                  </Tab>
                ))}
              </TabList>
              <IconButton
                icon={<AddIcon />}
                colorScheme="teal"
                variant="ghost"
                aria-label="新規タブ追加"
                ml={2}
                onClick={() => {
                  // ここでタブ追加ロジックを実装
                  // 例: メモ内容から新しいタブを生成するなど
                  alert('この機能はまだ実装中です。メモから新しいタブを生成します。');
                }}
              />
            </Flex>

            <TabPanels>
              {tabData.map((tab, tabIndex) => (
                <TabPanel key={tabIndex} p={0}>
                  <Flex 
                    direction="column" 
                    justify="space-between" 
                    align="center" 
                    textAlign="center" 
                    px={4} 
                    pt={4} 
                    height={useBreakpointValue({ base: "70vh", md: "75vh", lg: "80vh" })} // レスポンシブな高さ
                  >
                    {/* コンテンツエリア - 高さを画面サイズに応じて調整 */}
                    <Box 
                      bg="gray.500" 
                      rounded="lg" 
                      shadow="md" 
                      p={6} 
                      width="100%" 
                      flex="1" // 可能な限り広がるように設定
                      minHeight={useBreakpointValue({ base: "50vh", md: "55vh", lg: "65vh" })} // 最小高さを設定
                      display="flex"
                      flexDirection="column"
                      overflowY="auto"
                      justifyContent="space-between"
                    >
                      {/* キャラクターたち - サイズを調整し、より効率的に配置 */}
                      <Flex 
                        w="100%" 
                        maxW="80%" 
                        mx="auto" 
                        justify="space-around" 
                        align="center" 
                        mt={20}
                        mb={4} 
                        gap={10}
                      >
                        <Flex direction="column" align="center">
                          <Image 
                            src="/images/expert.png" 
                            alt="熟練者キャラ" 
                            boxSize={useBreakpointValue({ base: "150px", md: "200px", lg: "250px" })} 
                            objectFit="contain" 
                          />
                          <Text  fontWeight="bold" fontSize="md">熟練者</Text>
                        </Flex>
                        <Flex direction="column" align="center">
                          <Image 
                            src="/images/beginner.png" 
                            alt="初心者キャラ" 
                            boxSize={useBreakpointValue({ base: "150px", md: "200px", lg: "250px" })} 
                            objectFit="contain" 
                          />
                          <Text  fontWeight="bold" fontSize="md">初心者</Text>
                        </Flex>
                        
                      </Flex>
                      
                      {/* 吹き出し - より効率的なスペース利用とレスポンシブ対応 */}
                      <Box
                        position="relative"
                        bg="white"
                        p={useBreakpointValue({ base: 4, md: 5, lg: 6 })}
                        rounded="lg"
                        shadow="sm"
                        width="50%"
                        maxW="80%"
                        mx="auto"
                        mt={2}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        _before={{
                          content: "''",
                          position: 'absolute',
                          bottom: '100%',
                          left: tab.dialogues[dialogueIndexes[tabIndex]].speaker === 'expert' ? '5%' : '95%',
                          transform: 'translateX(-50%)',
                          borderLeft: '10px solid transparent',
                          borderRight: '10px solid transparent',
                          borderBottom: '10px solid #FFFFFF',
                        }}
                      >
                        <Text 
                          fontSize={fontSize} 
                          fontWeight="bold" 
                          textAlign="center"
                          whiteSpace="pre-wrap"
                          wordBreak="break-word" 
                        >
                          {tab.dialogues[dialogueIndexes[tabIndex]].text}
                        </Text>
                      </Box>
                      {/* スライダー - コンテンツエリアの外に配置し、空間を最適化 */}
                      <Box width="100%" maxW="60%" mt={4} mx="auto">
                        <Slider
                          aria-label="セリフスライダー"
                          min={0}
                          max={tab.dialogues.length - 1}
                          step={1}
                          value={dialogueIndexes[tabIndex]}
                          onChange={(val) => updateDialogueIndex(tabIndex, val)}
                        >
                          <SliderTrack bg="teal.100" h="6px">
                            <SliderFilledTrack bg="teal.400" />
                          </SliderTrack>
                          <SliderThumb boxSize={4} />
                        </Slider>
                      </Box>
                    </Box>
                  </Flex>
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>

        {/* 右側（メモ帳） */}
        <Box flex="1" bg="white" p={6} overflowY="auto" height="100vh">
          <KeywordList />
        </Box>
      </Flex>
    </>
  );
}