import React, { useEffect } from 'react';
import { useRouter } from 'next/router'; // ★ useRouterをインポート
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

export default function LoadingPage() {
  const router = useRouter(); // ★ ルーターを取得

  // ★ メインプロセスからの通知を待つuseEffect
  useEffect(() => {
    // window.ipc は preload.ts で定義されたもの
    const unlisten = window.ipc.on('fastapi-ready', () => {
      console.log('Received fastapi-ready signal, navigating to /home');
      // ★ 準備完了の合図を受け取ったら/homeにページ遷移
      router.push('/home');
    });

    // コンポーネントがアンマウントされる時にリスナーを解除
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [router]); // routerを依存配列に追加

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
          博士を召喚中です...
        </Text>
        <Text fontSize="md" color="gray.400">
          (バックエンドサーバーを起動しています)
        </Text>
      </VStack>
    </Center>
  );
}