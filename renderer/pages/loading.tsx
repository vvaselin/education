import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    const unlisten = window.ipc.on('fastapi-ready', () => {
      console.log('Received fastapi-ready signal, navigating to /home');
      router.push('/home');
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [router]);

  return (
    <Center 
      width="100vw" 
      height="100vh" 
      bg="gray.800" 
      color="white"
    >
      <VStack spacing={6}>
        <Spinner size="xl" thickness="4px" color="teal.300" />
        <Text fontSize="2xl" fontWeight="bold">
          少女を召喚中です...
        </Text>
        <Text fontSize="md" color="gray.400">
          (バックエンドサーバーを起動しています)
        </Text>
      </VStack>
    </Center>
  );
}