import { useState } from 'react';
import {
  Box,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Tag,
  TagCloseButton,
  TagLabel
} from '@chakra-ui/react';

export default function KeywordList() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setInputValue('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  return (
    <Box
      p={3}
      bg="gray.100"
      rounded="md"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      {/* 入力エリア */}
      <Box mb={3}>
        <Text fontSize="lg" fontWeight="bold" mb={2}>キーワード</Text>
        <HStack>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="ボタン/Enter"
            size="sm"
          />
          <Button onClick={addKeyword} colorScheme="teal" size="sm">
            追加
          </Button>
        </HStack>
      </Box>

      {/* キーワード一覧（スクロール領域） */}
      <Box
        overflowY="auto"
        flex="1"
        pr={1}
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            width: '8px',
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '24px',
          },
        }}
      >
        <VStack align="start" spacing={2}>
          {keywords.map((keyword, index) => (
            <Tag key={index} size="md" colorScheme="teal" borderRadius="full">
              <TagLabel>{keyword}</TagLabel>
              <TagCloseButton onClick={() => removeKeyword(keyword)} />
            </Tag>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}