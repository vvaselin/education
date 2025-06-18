#!/usr/bin/env python3
"""
EduApp RAG Engine セットアップスクリプト
"""

import os
import subprocess
import sys
import time
from pathlib import Path

def run_command(command, description):
    """コマンドを実行"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description}完了")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description}失敗: {e}")
        print(f"エラー出力: {e.stderr}")
        return False

def check_docker():
    """Dockerが利用可能かチェック"""
    try:
        subprocess.run(["docker", "--version"], check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def check_python_packages():
    """必要なPythonパッケージがインストールされているかチェック"""
    required_packages = [
        "fastapi", "uvicorn", "qdrant-client", "langchain", 
        "sentence-transformers", "requests", "beautifulsoup4"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def create_env_file():
    """環境変数ファイルを作成"""
    env_file = Path(".env")
    if not env_file.exists():
        print("\n📝 .envファイルを作成中...")
        with open(env_file, "w", encoding="utf-8") as f:
            f.write("# EduApp RAG Engine 環境変数\n")
            f.write("OPENAI_API_KEY=your_openai_api_key_here\n")
            f.write("QDRANT_HOST=localhost\n")
            f.write("QDRANT_PORT=6333\n")
        print("✅ .envファイルを作成しました")
        print("⚠️  OPENAI_API_KEYを設定してください")
    else:
        print("✅ .envファイルは既に存在します")

def main():
    print("🚀 EduApp RAG Engine セットアップを開始します")
    
    # 1. Pythonパッケージのチェックとインストール
    missing_packages = check_python_packages()
    if missing_packages:
        print(f"\n📦 不足しているパッケージ: {', '.join(missing_packages)}")
        if not run_command("pip install -r requirements.txt", "依存関係のインストール"):
            print("❌ パッケージのインストールに失敗しました")
            return False
    else:
        print("✅ 必要なPythonパッケージは既にインストールされています")
    
    # 2. 環境変数ファイルの作成
    create_env_file()
    
    # 3. Qdrantサーバーの起動
    if check_docker():
        print("\n🐳 Dockerが利用可能です")
        if not run_command("docker-compose up -d", "Qdrantサーバーの起動"):
            print("❌ Qdrantサーバーの起動に失敗しました")
            return False
        
        # Qdrantの起動を待機
        print("⏳ Qdrantサーバーの起動を待機中...")
        time.sleep(10)
        
        # ヘルスチェック
        try:
            import requests
            response = requests.get("http://localhost:6333/collections", timeout=5)
            if response.status_code == 200:
                print("✅ Qdrantサーバーが正常に起動しました")
            else:
                print("⚠️  Qdrantサーバーの状態を確認できません")
        except Exception as e:
            print(f"⚠️  Qdrantヘルスチェックエラー: {e}")
    else:
        print("\n⚠️  Dockerが利用できません")
        print("手動でQdrantをインストールしてください:")
        print("  - macOS: brew install qdrant")
        print("  - Linux: 公式バイナリをダウンロード")
        print("  - Windows: Docker Desktopをインストール")
    
    # 4. 初期データの準備
    print("\n📚 初期データの準備中...")
    if run_command("python cpprefjp_scraper.py", "cpprefjpデータの取得"):
        print("✅ 初期データの準備が完了しました")
    else:
        print("⚠️  データ取得に失敗しましたが、サンプルデータで動作します")
    
    print("\n🎉 セットアップが完了しました！")
    print("\n次のステップ:")
    print("1. .envファイルでOPENAI_API_KEYを設定")
    print("2. RAGエンジンを起動: uvicorn main_qdrant:app --host 0.0.0.0 --port 8000")
    print("3. ブラウザで http://localhost:8000/docs にアクセスしてAPIをテスト")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)