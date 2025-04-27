import React, { useState } from 'react';
import Head from 'next/head';
import { Box, Flex, Image, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, useBreakpointValue } from '@chakra-ui/react';

const dialogues = [
  { speaker: 'beginner', text: 'ここってどうやるの？' },
  { speaker: 'expert', text: 'こうやるといいよ！' },
  { speaker: 'beginner', text: 'なるほど、ありがとう！' },
  { speaker: 'expert', text: 'いつでも聞いてね！' },
];

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const currentDialogue = dialogues[index];

  const imageSize = useBreakpointValue({ base: '70px', md: '100px' });
  const fontSize = useBreakpointValue({ base: 'sm', md: 'lg' });

  return (
    <>
      <Head>
        <title>EduApp - スライダーでセリフ切り替え</title>
      </Head>

      <Flex direction="column" minHeight="100vh" bg="gray.400" justify="center" align="center" textAlign="center" px={4}>

        {/* キャラクターたち */}
        <Flex w="100%" maxW="400px" justify="space-around" align="center" mb={2}>
          <Flex direction="column" align="center">
            <Image src="/images/beginner.png" alt="初心者キャラ" boxSize={imageSize} objectFit="contain" />
            <Text mt={1} fontWeight="bold" fontSize="xs">初心者</Text>
          </Flex>
          <Flex direction="column" align="center">
            <Image src="/images/expert.png" alt="熟練者キャラ" boxSize={imageSize} objectFit="contain" />
            <Text mt={1} fontWeight="bold" fontSize="xs">熟練者</Text>
          </Flex>
        </Flex>

        {/* 吹き出し */}
        <Box
          position="relative"
          bg="white"
          p={6}
          rounded="lg"
          shadow="xl"
          minW="400px"
          maxW="80%"
          mt={4}
          _before={{
            content: "''",
            position: 'absolute',
            bottom: '100%', // 上向き
            left: currentDialogue.speaker === 'beginner' ? '25%' : '75%',
            transform: 'translateX(-50%)',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid white',
          }}
        >
          <Text fontSize={fontSize} fontWeight="bold">
            {currentDialogue.text}
          </Text>
        </Box>

        {/* スライダー */}
        <Box w="30%" mt={10}>
          <Slider
            aria-label="セリフスライダー"
            min={0}
            max={dialogues.length - 1}
            step={1}
            value={index}
            onChange={(val) => setIndex(val)}
          >
            <SliderTrack bg="teal.100">
              <SliderFilledTrack bg="teal.400" />
            </SliderTrack>
            <SliderThumb boxSize={6} />
          </Slider>
        </Box>

      </Flex>
    </>
  );
}
