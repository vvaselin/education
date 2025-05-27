// renderer/components/PhaserGame.tsx

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Box } from '@chakra-ui/react';

// ゲームのシーンを定義するところ
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ゲームで使う素材を読み込むところ
  preload() {
    // Nextronの開発サーバーのURLを基準に画像パスを指定するよ
    this.load.setBaseURL('http://localhost:8888');

    // これで public/images/beginner.png を見つけられるはず！
    this.load.image('player', '/images/beginner.png'); 
  }

  // ゲームが始まった時に実行されるところ
  create() {
    const player = this.add.image(150, 150, 'player');
    
    // ちょっとだけアニメーションさせてみる
    this.tweens.add({
      targets: player,
      y: 160,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
}

// PhaserゲームをReactコンポーネントとしてラップする部分
const PhaserGame = () => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameContainer.current && !gameInstance.current) {
      // ゲームの設定
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 300,  // ゲーム画面の幅
        height: 300, // ゲーム画面の高さ
        parent: gameContainer.current, // このdiv要素にゲームを描画する
        scene: [GameScene], // 使用するシーン
        backgroundColor: '#FFFFFF', // 背景色
      };

      // ゲームを起動！
      gameInstance.current = new Phaser.Game(config);
    }

    // コンポーネントが消える時にゲームもちゃんと終了させる（大事！）
    return () => {
      gameInstance.current?.destroy(true);
      gameInstance.current = null;
    };
  }, []);

  return <Box ref={gameContainer} />;
};

export default PhaserGame;