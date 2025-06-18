# EduApp RAG Engine with Qdrant

EduAppのC++学習支援AIチャットボット用RAGエンジンです。Qdrantベクトルデータベースを使用してcpprefjpの情報を効率的に検索・活用します。

## 機能

- **Qdrant統合**: 高性能なベクトル検索エンジン
- **cpprefjpスクレイピング**: 最新のC++リファレンス情報を自動取得
- **日本語対応**: 日本語での質問・回答に対応
- **会話履歴**: チャット履歴の永続化
- **ソース表示**: 回答の根拠となる情報源を表示

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. Qdrantサーバーの起動

Docker Composeを使用してQdrantサーバーを起動：

```bash
docker-compose up -d
```

または、Qdrantを直接インストール：

```bash
# macOS
brew install qdrant

# Ubuntu/Debian
curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz | tar -xz
./qdrant
```

### 3. 環境変数の設定

`.env`ファイルを作成：

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. 初期データの準備

cpprefjpからデータを取得：

```bash
python cpprefjp_scraper.py
```

## 使用方法

### RAGエンジンの起動

```bash
# Qdrant版（推奨）
uvicorn main_qdrant:app --host 0.0.0.0 --port 8000

# 従来のFAISS版
uvicorn main:app --host 0.0.0.0 --port 8000
```

### API エンドポイント

- `GET /health` - ヘルスチェック
- `GET /collection-info` - Qdrantコレクション情報
- `GET /history` - チャット履歴取得
- `POST /rag` - チャット質問
- `POST /reload-data` - データ再読み込み

### チャット例

```bash
curl -X POST "http://localhost:8000/rag" \
     -H "Content-Type: application/json" \
     -d '{"message": "std::vectorの使い方を教えてください"}'
```

## アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   RAG Engine    │    │   Qdrant DB     │
│   (Nextron)     │◄──►│   (FastAPI)     │◄──►│   (Vector DB)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   cpprefjp      │
                       │   Scraper       │
                       └─────────────────┘
```

## データフロー

1. **データ取得**: cpprefjp_scraper.pyでcpprefjpから情報を取得
2. **前処理**: テキストをチャンクに分割
3. **ベクトル化**: sentence-transformersでベクトル化
4. **保存**: Qdrantにベクトルデータを保存
5. **検索**: 質問をベクトル化して類似ドキュメントを検索
6. **回答生成**: LLMでコンテキストを基に回答を生成

## カスタマイズ

### 新しいデータソースの追加

`cpprefjp_scraper.py`を参考に、新しいスクレイパーを作成：

```python
class CustomScraper:
    def scrape_data(self) -> List[Dict[str, Any]]:
        # カスタムスクレイピングロジック
        pass
```

### 検索パラメータの調整

`qdrant_manager.py`で検索パラメータを調整：

```python
# 検索結果数を変更
search_results = qdrant_manager.search_similar(query, limit=10)

# 類似度閾値を設定
search_result = self.client.search(
    collection_name=self.collection_name,
    query_vector=query_vector,
    limit=limit,
    score_threshold=0.7  # 類似度0.7以上のみ
)
```

## トラブルシューティング

### Qdrant接続エラー

```bash
# Qdrantサーバーの状態確認
curl http://localhost:6333/collections

# Dockerログの確認
docker-compose logs qdrant
```

### メモリ不足

```bash
# チャット履歴をクリア
rm chat_history.json
```

### データ更新

```bash
# データを完全に更新
curl -X POST "http://localhost:8000/reload-data"
```

## 今後の改善予定

- [ ] リアルタイムデータ更新
- [ ] 複数言語対応
- [ ] より高度な検索フィルタリング
- [ ] ユーザー固有の学習履歴
- [ ] コード例の自動生成

## ライセンス

MIT License