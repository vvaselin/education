import React, { useState } from 'react'
import Head from 'next/head'
import { Box, Button, Flex, Image, Text, useBreakpointValue } from '@chakra-ui/react'

const dialogues = [
  { speaker: 'beginner', text: 'ここってどうやるの？' },
  { speaker: 'expert', text: 'こうやるといいよ！' },
  { speaker: 'beginner', text: 'なるほど、ありがとう！' },
  { speaker: 'expert', text: 'いつでも聞いてね！' },
]

export default function HomePage() {
  const [index, setIndex] = useState(0)
  const currentDialogue = dialogues[index]

  // 画面サイズによって画像サイズを変える
  const imageSize = useBreakpointValue({ base: '150px', md: '200px' })
  const fontSize = useBreakpointValue({ base: 'md', md: 'xl' })

  const nextDialogue = () => {
    setIndex((prev) => (prev + 1) % dialogues.length)
  }

  return (
    <React.Fragment>
      <Head>
        <title>EduApp - セリフ切り替え</title>
      </Head>

      <Flex direction="column" minHeight="100vh" bg="gray.300">
        
        {/* キャラクターたち */}
        <Flex flex="3" p={4}>
          {/* 初心者キャラ */}
          <Flex flex="1" direction="column" align="center" justify="center" m={2} rounded="md" position="relative">
            <Image
              src="/images/beginner.png"
              alt="初心者キャラ"
              boxSize={imageSize}
              objectFit="contain"
              mb={4}
            />
            <Text fontWeight="bold">初心者</Text>

            {currentDialogue.speaker === 'beginner' && (
              <Box 
                bg="white" 
                p={3} 
                rounded="md" 
                shadow="md"
                position="absolute" 
                top="-10px"
                left="60%"
                transform="translateX(-70%)"
                _after={{
                  content: "''",
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderWidth: '15px',
                  borderStyle: 'solid',
                  borderColor: 'white transparent transparent transparent',
                }}
              >
                <Text fontSize={fontSize}>{currentDialogue.text}</Text>
              </Box>
            )}
          </Flex>

          {/* 熟練者キャラ */}
          <Flex flex="1" direction="column" align="center" justify="center" m={2} rounded="md" position="relative">
            <Image
              src="/images/expert.png"
              alt="熟練者キャラ"
              boxSize={imageSize}
              objectFit="contain"
              mb={4}
            />
            <Text fontWeight="bold">熟練者</Text>

            {currentDialogue.speaker === 'expert' && (
              <Box 
                bg="white" 
                p={3} 
                rounded="md" 
                shadow="md"
                position="absolute" 
                top="-10px"
                left="40%"
                transform="translateX(-30%)"
                _after={{
                  content: "''",
                  position: 'absolute',
                  bottom: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderWidth: '15px',
                  borderStyle: 'solid',
                  borderColor: 'white transparent transparent transparent',
                }}
              >
                <Text fontSize={fontSize}>{currentDialogue.text}</Text>
              </Box>
            )}
          </Flex>
        </Flex>

        {/* 次へボタン */}
        <Flex flex="1" p={1} align="center" justify="center">
          <Button colorScheme="teal" size="lg" onClick={nextDialogue}>
            次へ
          </Button>
        </Flex>

      </Flex>
    </React.Fragment>
  )
}
