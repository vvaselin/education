import dynamic from 'next/dynamic';
import React, { useState, useRef, useEffect } from 'react'; // useRef, useEffectはDialogueDisplayに移動したので不要になるかも
import Head from 'next/head';
// import KeywordList from './KeywordList'; // もう使わない
import DiscordChat from './DiscordChat';   // これと
import DialogueDisplay from './DialogueDisplay'; // ★これを使う！

import { 
  Box, 
  Flex, 
  // Image, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, useBreakpointValue,
  // Select, Badge, IconButton, Button, Menu, MenuButton, MenuList, MenuItem, MenuDivider,
  // Spacer, HStack, // これらはDialogueDisplayが使う
  Button, // PhaserGameのボタン用に残す
  useDisclosure, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
// import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons'; // DialogueDisplayが使う


const PhaserGame = dynamic(() => import('../components/PhaserGame'), {
  ssr: false,
  loading: () => <p>ゲームを読み込み中...</p>
});

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
  // ★DialogueDisplayで使うstateや関数は、基本的にここに残すか、ここで定義してPropsで渡す
  const [activeTab, setActiveTab] = useState(0);
  const [dialogueIndexes, setDialogueIndexes] = useState(tabData.map(() => 0));

  // 特定タブのダイアログインデックスを更新
  const updateDialogueIndex = (tabIndex: number, newDialogueIndex: number) => {
    const newIndexes = [...dialogueIndexes];
    newIndexes[tabIndex] = newDialogueIndex;
    setDialogueIndexes(newIndexes);
  };

  const handleAddNewTopic = () => {
    alert('この機能はまだ実装中です。メモから新しいタブを生成します。');
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialModalRef = useRef(null);

  return (
    <>
      <Head>
        <title>EduApp</title>
        {/* ... (style jsx global は変更なし) ... */}
      </Head>
      
      <Box width="1024px" height="576px" margin="0 auto" overflow="hidden">
        <Flex direction="row" height="100%" width="100%">
          {/* 左側（解説画面） */}
          <DialogueDisplay
            tabData={tabData}
            activeTab={activeTab}
            dialogueIndexes={dialogueIndexes}
            onTabChange={setActiveTab} // setActiveTabを直接渡す
            onDialogueIndexChange={updateDialogueIndex}
            onAddNewTopic={handleAddNewTopic}
          />

          {/* 右側（チャット画面） */}
          <Box 
            flex="2" 
            bg="gray.800" // チャット画面の背景色に合わせてみる
            p={0}
            height="100%"
            display="flex"
            flexDirection="column"
          >
            <DiscordChat />
            <Button colorScheme="orange" onClick={onOpen}>
              ゲームで遊ぶ！
            </Button>
          </Box>
        </Flex>
      </Box>

      {/* ゲームのモーダル */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        isCentered 
        size="xl"
        initialFocusRef={initialModalRef}
      >
        <ModalOverlay />
          <ModalContent ref={initialModalRef}>
            <ModalHeader>Phaser ゲーム</ModalHeader>
            <ModalCloseButton />
            <ModalBody p={2}>
              <PhaserGame />
            </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}