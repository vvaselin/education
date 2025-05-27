// renderer/components/PhaserGame.tsx

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Box } from '@chakra-ui/react';

// ゲームのシーンを定義するところ
class GameScene extends Phaser.Scene {

    player: Phaser.Physics.Arcade.Sprite;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    playerSpeed: number;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.setBaseURL('http://localhost:8888');
        this.load.image('player', '/images/beginner.png'); 
    }

    create() {
            // ★this.プロパティ名 で、シーンに持ち物を追加していく
        this.playerSpeed = 500;

        // this.add.image じゃなくて、物理エンジンが働く this.physics.add.sprite を使う
        this.player = this.physics.add.sprite(150, 150, 'player');
        // プレイヤーのサイズを調整
        this.player.setScale(0.5);

        // プレイヤーが画面の外に出ないように設定
        this.player.setCollideWorldBounds(true);
        this.player.refreshBody();

        // カーソルキーの情報を、これもシーンのプロパティとして持たせる
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    update() {
        // ★createで定義したプロパティを、this経由でいつでも呼び出せる
        const direction = new Phaser.Math.Vector2(0, 0);

        if (this.cursors.left.isDown) {
        direction.x = -1;
        } else if (this.cursors.right.isDown) {
        direction.x = 1;
        }

        if (this.cursors.up.isDown) {
        direction.y = -1;
        } else if (this.cursors.down.isDown) {
        direction.y = 1;
        }

        if (direction.length() > 0) {
        direction.normalize();
        }

        this.player.setVelocity(direction.x * this.playerSpeed, direction.y * this.playerSpeed);
    }

}

// PhaserゲームをReactコンポーネントとしてラップする部分
const PhaserGame = () => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameContainer.current && !gameInstance.current) {
            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                width: 550,
                height: 400,
                parent: gameContainer.current,
                scene: [GameScene],
                backgroundColor: '#FFFFFF',
                physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                }
                },
            };
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