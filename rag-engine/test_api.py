import requests
import json

# FastAPIサーバーのテスト
try:
    # ヘルスチェック
    health_response = requests.get("http://localhost:8000/health")
    print(f"Health check: {health_response.status_code}")
    print(f"Health response: {health_response.text}")
    
    # RAGエンドポイントのテスト
    rag_data = {"message": "string型の具体的な使用例教えて"}
    rag_response = requests.post(
        "http://localhost:8000/rag",
        headers={"Content-Type": "application/json"},
        data=json.dumps(rag_data)
    )
    print(f"RAG status: {rag_response.status_code}")
    print(f"RAG response: {rag_response.text}")
    
except Exception as e:
    print(f"Error: {e}")
