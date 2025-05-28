import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Avatar,
  Text,
  Input,
  Button,
  Flex,
  Spacer,
} from '@chakra-ui/react';

// メッセージの型を定義（どんな情報を持つか）
interface Message {
  id: string;
  text: string;
  user: string; // 'You' または 'AI Bot' など
  avatar: string; // アイコン画像のパス
  timestamp?: string; // あとで追加できるように
}

// サンプルメッセージ（最初から表示されてるメッセージ）
const initialMessages: Message[] = [
  { id: '1', text: 'こんにちは！AIだよ。何かお手伝いできることはある？', user: 'AI Bot', avatar: '/images/expert.png' },
  { id: '2', text: 'やあ！チャット機能を作ってるんだ！', user: 'You', avatar: '/images/beginner.png' },
  { id: '3', text: 'それは素晴らしいね！お手伝いするよ！', user: 'AI Bot', avatar: '/images/expert.png' },
];

export default function DiscordChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // 自動スクロール用

  // メッセージが追加されたら、一番下にスクロールする関数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // messages が更新されるたびに、一番下にスクロール
  useEffect(scrollToBottom, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const newMessage: Message = {
      id: String(Date.now()), // 簡単なユニークID
      text: inputValue,
      user: 'You', // とりあえず自分のメッセージとして送信
      avatar: '/images/beginner.png', // 自分のアバター
    };

    setMessages([...messages, newMessage]);
    setInputValue(''); // 入力欄をクリア
  };

  return (
    <Flex direction="column" height="100%" bg="gray.700" color="white" rounded="md">
        <HStack
            p={3} // 上下左右の余白を少し
            borderBottomWidth="1px" // 下に境界線
            borderColor="gray.600"  // 境界線の色
            spacing={3}             // アイコンと名前の間のスペース
            align="center"          // アイコンと名前を縦方向中央揃え
        >
            <Avatar size="sm" name="博士" src="/images/expert.png" />
            <Text fontWeight="bold" fontSize="md">博士</Text>
        </HStack>

        {/* メッセージ表示エリア */}
        <Box flex="1" overflowY="auto" p={4} css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#2f3136' },
            '&::-webkit-scrollbar-thumb': { background: '#4f545c', borderRadius: '24px' },
        }}
>
            <VStack spacing={4} align="stretch">
            {messages.map((msg) => (
                <HStack
                key={msg.id}
                alignSelf={msg.user === 'You' ? 'flex-end' : 'flex-start'}
                w="auto" // 幅は自動
                maxWidth="80%" // 最大幅は80%くらいに
                >
                {msg.user !== 'You' && <Avatar size="sm" name={msg.user} src={msg.avatar} mr={2} />}
                <Box
                    bg={msg.user === 'You' ? 'blue.500' : 'gray.600'}
                    px={3}
                    py={2}
                    rounded="lg"
                    boxShadow="sm"
                >
                    <Text fontSize="sm">{msg.text}</Text>
                </Box>
                {msg.user === 'You' && <Avatar size="sm" name={msg.user} src={msg.avatar} ml={2} />}
                </HStack>
            ))}
            {/* スクロール制御用の空のdiv */}
            <div ref={messagesEndRef} />
            </VStack>
        </Box>

        {/* メッセージ入力エリア */}
        <HStack p={3} borderTopWidth="1px" borderColor="gray.600">
            <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            bg="gray.600"
            borderColor="gray.500"
            _hover={{ borderColor: 'gray.400' }}
            _focus={{ borderColor: 'teal.300', boxShadow: `0 0 0 1px var(--chakra-colors-teal-300)`}}
            // ★ onKeyPress を onKeyDown に変更！
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
                }
            }}
            />
            <Button onClick={handleSendMessage} colorScheme="teal">
            送信
            </Button>
        </HStack>
    </Flex>
  );
}