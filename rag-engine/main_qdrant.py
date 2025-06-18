from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_503_SERVICE_UNAVAILABLE
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import FileChatMessageHistory
from langchain.prompts import PromptTemplate
from qdrant_manager import QdrantManager
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8888"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_is_ready = False
qdrant_manager = None
llm = None
memory = None

@app.on_event("startup")
async def startup_event():
    global qdrant_manager, llm, memory, app_is_ready
    
    try:
        # Qdrantマネージャーの初期化
        qdrant_manager = QdrantManager()
        
        # データが存在しない場合は初期データをアップロード
        collection_info = qdrant_manager.get_collection_info()
        if "error" in collection_info or collection_info.get("points_count", 0) == 0:
            print("初期データをアップロード中...")
            qdrant_manager.process_and_upload_data()
        
        # LLMの初期化
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
        
        # メモリの初期化
        history = FileChatMessageHistory("chat_history.json")
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            chat_memory=history,
            return_messages=True,
            output_key='answer'
        )
        
        app_is_ready = True
        print("Qdrant RAGエンジンが起動しました")
        
    except Exception as e:
        print(f"起動エラー: {e}")
        app_is_ready = False

class Message(BaseModel):
    message: str

@app.get("/health")
async def health_check(response: Response):
    if app_is_ready:
        return {"status": "ok", "engine": "qdrant"}
    else:
        response.status_code = HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready"}

@app.get("/collection-info")
async def get_collection_info():
    if not qdrant_manager:
        return {"error": "Qdrantマネージャーが初期化されていません"}
    return qdrant_manager.get_collection_info()

@app.get("/history")
async def get_history():
    if not memory:
        return {"history": []}
    
    messages = memory.chat_memory.messages
    history_list = []
    for msg in messages:
        msg_id = getattr(msg, 'id', None)
        if msg.type == 'human':
            history_list.append({
                "user": "You", 
                "text": msg.content, 
                "avatar": "/images/beginner.png", 
                "id": msg_id
            })
        elif msg.type == 'ai':
            history_list.append({
                "user": "AI Bot", 
                "text": msg.content, 
                "avatar": "/images/expert.png", 
                "id": msg_id
            })
    return {"history": history_list}

@app.post("/rag")
async def rag_chat(data: Message):
    if not app_is_ready or not qdrant_manager or not llm:
        return {"error": "システムが準備できていません"}
    
    try:
        # 類似ドキュメントを検索
        search_results = qdrant_manager.search_similar(data.message, limit=3)
        
        # コンテキストを構築
        context = "\n\n".join([result["text"] for result in search_results])
        
        # プロンプトテンプレート
        prompt_template = """
あなたはC++の専門家です。以下のコンテキスト情報を参考にして、ユーザーの質問に日本語で回答してください。

コンテキスト情報:
{context}

ユーザーの質問: {question}

回答は以下の点に注意してください：
- 分かりやすく簡潔に説明する
- 必要に応じてコード例を示す
- 日本語で回答する
- コンテキスト情報を活用する

回答:
"""
        
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # LLMで回答生成
        formatted_prompt = prompt.format(
            context=context,
            question=data.message
        )
        
        response = llm.invoke(formatted_prompt)
        answer = response.content
        
        # メモリに保存
        memory.chat_memory.add_user_message(data.message)
        memory.chat_memory.add_ai_message(answer)
        
        return {
            "response": answer,
            "sources": [
                {
                    "title": result["metadata"]["title"],
                    "url": result["metadata"]["url"],
                    "score": result["score"]
                }
                for result in search_results
            ]
        }
        
    except Exception as e:
        return {"error": f"処理エラー: {str(e)}"}

@app.post("/reload-data")
async def reload_data():
    """データを再読み込み"""
    if not qdrant_manager:
        return {"error": "Qdrantマネージャーが初期化されていません"}
    
    try:
        qdrant_manager.process_and_upload_data()
        return {"message": "データの再読み込みが完了しました"}
    except Exception as e:
        return {"error": f"データ再読み込みエラー: {str(e)}"}