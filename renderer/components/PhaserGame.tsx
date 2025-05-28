// renderer/components/PhaserGame.tsx

import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Box } from '@chakra-ui/react';

// ゲームのシーンを定義するところ
class GameScene extends Phaser.Scene {
    // これから使うプロパティ（シーンの持ち物）を宣言しておく
    player;
    cursors;
    bullets;
    spaceKey;
    playerSpeed;
    enemies;
    fireRate;
    nextFire;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // プレイヤーの画像を読み込み
        this.load.image('player', '/images/beginner.png');
        this.load.image('enemy', '/images/expert.png');

        // 弾のテクスチャ生成
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffffff, 1);
        bulletGraphics.fillCircle(5, 5, 5);  // 半径5の円を描画
        bulletGraphics.generateTexture('bullet', 10, 10); 
        bulletGraphics.destroy();
    }

    create() {
        this.playerSpeed = 500;
        this.fireRate = 100; // 弾を発射する間隔（ミリ秒）
        this.nextFire = 0;   // 次に弾を発射できる時間

        // プレイヤーを配置
        this.player = this.physics.add.sprite(400, 550, 'player');
        this.player.setScale(0.5).refreshBody();

        this.player.body.setCircle(this.player.displayWidth / 2);

        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // キーボード入力を準備
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // 弾のグループ
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 30, 
        });

        // 敵グループ作成
        this.enemies = this.physics.add.group({
            defaultKey: 'enemy',
            maxSize: 50, 
        });

        // spawnEnemiesを呼び出すタイマーイベント
        this.time.addEvent({
            delay: 3000,
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
        });

        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            this.bulletHitEnemy,
            null,
            this
        );
    }

    update(time, delta) {
        // プレイヤーの移動処理
        const direction = new Phaser.Math.Vector2(0, 0);
        if (this.cursors.left.isDown) direction.x = -1;
        else if (this.cursors.right.isDown) direction.x = 1;
        if (this.cursors.up.isDown) direction.y = -1;
        else if (this.cursors.down.isDown) direction.y = 1;
        if (direction.length() > 0) direction.normalize();
        this.player.setVelocity(direction.x * this.playerSpeed, direction.y * this.playerSpeed);

        // 弾を発射
        if (this.spaceKey.isDown && time > this.nextFire) {
            const bullet = this.bullets.get(this.player.x, this.player.y - 30);

            if (bullet) {
                bullet.body.enable = true;
                bullet.setActive(true);
                bullet.setVisible(true);

                bullet.setDepth(6);
                bullet.setVelocityY(-500);
                
                this.nextFire = time + this.fireRate;
            }
        }

        // 画面外に出た弾を非アクティブにする
        this.bullets.children.each(bullet => {
            if (bullet.active && bullet.y < -10) {
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        });
        // 画面外に出た敵を非アクティブにする
        this.enemies.children.each(enemy => {
            if (enemy.active && enemy.y > 610) {
                enemy.setActive(false);
                enemy.setVisible(false);
            }
        });
    }

    // 敵をスポーンする関数
    spawnEnemies() {
        const enemy = this.enemies.get();

        if (enemy) {
            const x = Phaser.Math.Between(50, 750);
            const y = -20;

            enemy.setPosition(x, y);
            enemy.setScale(0.5);
            enemy.refreshBody();

            const radius = enemy.displayWidth / 2;
            const offsetX = 5; 
            const offsetY = 0;
            enemy.body.setCircle(radius, offsetX, offsetY);
            
            enemy.setDepth(5);
            enemy.body.enable = true; 
            enemy.setActive(true);
            enemy.setVisible(true);
            
            enemy.setVelocityY(80);
            enemy.setTint(0xff0000);
        }
    }

    // 弾が敵に当たったときの処理
    bulletHitEnemy(bullet, enemy) {
        bullet.setActive(false);
        bullet.setVisible(false);
        enemy.setActive(false);
        enemy.setVisible(false);

        if (bullet.body) {
            bullet.body.enable = false;
        }
        if (enemy.body) {
            enemy.body.enable = false;
        }
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
                backgroundColor: '#2d2d2d',
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