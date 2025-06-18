import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  VStack,
  HStack,
  Avatar,
  Text,
  Input,
  Button,
  Flex,
  Spinner,
  Heading,
  UnorderedList,
  ListItem,
  Link
} from '@chakra-ui/react';

// メッセージの型を定義
interface Message {
  id: string;
  text: string;
  user: string;
  avatar: string;
}

const initialMessages: Message[] = [
  { id: '1', text: 'こんにちは、博士じゃよ！ 何かお手伝いできることはあるかな？', user: 'AI Bot', avatar: '/images/expert.png' },
  { id: '2', text: 'やあ！チャット機能を作ってるんだ！', user: 'You', avatar: '/images/beginner.png' },
  { id: '3', text: 'それは素晴らしいのう！お手伝いしよう！', user: 'AI Bot', avatar: '/images/expert.png' },
];

export default function DiscordChat() {
  const [messages, setMessages] = useState<Message[]>();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await window.ipc.invoke('get-history');
        if (data.error) throw new Error(data.error);

        if (Array.isArray(data.history) && data.history.length > 0) {
          setMessages(data.history);
        } else {
          setMessages(initialMessages);
        }

      } catch (error) {
        console.error("Could not fetch chat history:", error);
        setMessages(initialMessages);
      }
    };

    fetchHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const sendMessageToApi = async (question: string) => {
    const data = await window.ipc.invoke('post-rag', question);
    if (data.error) throw new Error(data.error);
    return data.response;
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return; // 送信中なら何もしない

    const userMessage: Message = {
      id: String(Date.now()),
      text: inputValue,
      user: 'You',
      avatar: '/images/beginner.png',
    };
    setMessages((prev) => [...prev, userMessage]);
    const question = inputValue;
    setInputValue('');

    setIsLoading(true); // ★ ローディング開始

    try {
      const aiAnswer = await sendMessageToApi(question);
      const aiMessage: Message = {
        id: String(Date.now() + 1),
        text: aiAnswer,
        user: 'AI Bot',
        avatar: '/images/expert.png',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('API通信エラー:', error);
      const errorMessage: Message = {
        id: String(Date.now() + 1),
        text: error.message || '不明なエラーが発生しました。',
        user: 'AI Bot',
        avatar: '/images/expert.png',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // ★ ローディング終了（成功・失敗問わず）
    }
  };

  return (
    <Flex direction="column" flex="1" minHeight="0" bg="gray.700" color="white" rounded="md">
      {/* ... ヘッダー ... */}
      <HStack p={3} borderBottomWidth="1px" borderColor="gray.600" spacing={3} align="center">
        <Avatar size="sm" name="博士" src="/images/expert.png" />
        <Text fontWeight="bold" fontSize="md">博士</Text>
      </HStack>

      {/* メッセージ表示エリア */}
      <Box flex="1" overflowY="auto" p={4} 
        css={{
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#808080",
            borderRadius: "24px",
          },
        }}>
        <VStack spacing={4} align="stretch">
          {Array.isArray(messages) && messages.map((msg, index) => (
            <HStack key={msg.id} alignSelf={msg.user === 'You' ? 'flex-end' : 'flex-start'} w="auto" maxWidth="80%">
              {msg.user !== 'You' && <Avatar size="sm" name={msg.user} src={msg.avatar} mr={2} />}
              <Box bg="gray.600" px={3} py={2} rounded="lg" boxShadow="sm" color="white">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <Heading as="h1" size="lg" my={4} {...props} />,
                    h2: ({node, ...props}) => <Heading as="h2" size="md" my={3} {...props} />,
                    p: ({node, ...props}) => <Text my={2} {...props} />,
                    ul: ({node, ...props}) => <UnorderedList my={2} {...props} />,
                    li: ({node, ...props}) => <ListItem {...props} />,
                    a: ({node, ...props}) => <Link color="teal.300" isExternal {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </Box>
              {msg.user === 'You' && <Avatar size="sm" name={msg.user} src={msg.avatar} ml={2} />}
            </HStack>
          ))}

          {/* ★ 3. ローディング中に「思考中...」を表示 */}
          {isLoading && (
            <HStack alignSelf="flex-start" w="auto">
              <Avatar size="sm" name="AI Bot" src="/images/expert.png" mr={2} />
              <Box bg="gray.600" px={3} py={2} rounded="lg" boxShadow="sm">
                <HStack>
                  <Spinner size="xs" />
                  <Text fontSize="sm">思考中...</Text>
                </HStack>
              </Box>
            </HStack>
          )}

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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          // ★ 3. ローディング中は入力不可にする
          isDisabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          colorScheme="teal"
          // ★ 3. ローディング中はボタンを無効化＆スピナー表示
          isLoading={isLoading}
        >
          送信
        </Button>
      </HStack>
    </Flex>
  );
}
