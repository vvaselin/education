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
    <Box p={6} bg="gray.100" rounded="md">
      <Text fontSize="xl" fontWeight="bold" mb={2}>キーワードを入力</Text>

      <HStack mb={4}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addKeyword();
            }
          }}
          placeholder="ボタンかEnterキー"
        />
        <Button onClick={addKeyword} colorScheme="teal">
          追加
        </Button>
      </HStack>

      <VStack align="start" spacing={2}>
        {keywords.map((keyword, index) => (
          <Tag key={index} size="lg" colorScheme="teal" borderRadius="full">
            <TagLabel>{keyword}</TagLabel>
            <TagCloseButton onClick={() => removeKeyword(keyword)} />
          </Tag>
        ))}
      </VStack>
    </Box>
  );
}
