import dynamic from 'next/dynamic';
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import DiscordChat from './DiscordChat';
import CodeEditorDisplay from './CodeEditorDisplay';

import { 
  Box, 
  Flex, 
  Button, 
  useDisclosure, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';


const PhaserGame = dynamic(() => import('../components/PhaserGame'), {
  ssr: false,
  loading: () => <p>ゲームを読み込み中...</p>
});

export default function HomePage() {

  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialModalRef = useRef(null);

  return (
    <>
      <Head>
        <title>EduApp</title>
        <style jsx global>{`
          html, body, #__next {
            width: 100%;      
            height: 100%;
            overflow: hidden;
            margin: 0 auto;
            padding: 0;
            box-sizing: border-box;
          }
        `}</style>
      </Head> 
      
      <Box 
        width="1279px" 
        height="719px" 
        overflow="hidden"
        bg="gray.600"
        p={3}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Flex direction="row" height="100%" width="100%">
          {/* 左側（コードエディタ） */}
          <CodeEditorDisplay language="cpp" />

          {/* 右側（チャット画面） */}
          <Box 
            flex="2" 
            p={2}
            height="100%"
            display="flex"
            flexDirection="column"
            minWidth="0"
            overflow="hidden"
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