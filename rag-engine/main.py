from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_503_SERVICE_UNAVAILABLE
from pydantic import BaseModel
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_message_histories import FileChatMessageHistory
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import qdrant_client
from langchain_qdrant import Qdrant
import json
import os
import re 

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_is_ready = False
INTIMACY_FILE = "intimacy.json"

def load_favorability():
    """好感度を読み込む"""
    try:
        with open(INTIMACY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("favorability", 0)
    except (FileNotFoundError, json.JSONDecodeError):
        # ファイルが存在しない場合は初期値0で作成
        save_favorability(0)
        return 0

def save_favorability(favorability: int):
    """好感度を保存する"""
    data = {"favorability": favorability}
    with open(INTIMACY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def update_favorability(delta: int):
    """好感度を更新する（増減値を指定）"""
    current = load_favorability()
    new_value = max(0, min(100, current + delta))  # 0-100の範囲に制限
    save_favorability(new_value)
    return new_value

@app.on_event("startup")
async def startup_event():
    global qa_chain, memory, app_is_ready, PROMPT
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    client = qdrant_client.QdrantClient(url="http://qdrant:6333", prefer_grpc=True)
    vector_store = Qdrant(
        client=client, 
        collection_name="cpp_study_db",
        embeddings=embeddings
    )
    retriever = vector_store.as_retriever()
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    history = FileChatMessageHistory("chat_history.json", encoding="utf-8")
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        chat_memory=history,
        return_messages=True,
        output_key='answer',
        input_key="question"
    )
    
    with open("prompts/tundere_prompt.txt", "r", encoding="utf-8") as f:
        prompt_template = f.read()

    PROMPT = PromptTemplate(
        template=prompt_template, input_variables=["context", "question", "favorability"]
    )

    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        combine_docs_chain_kwargs={"prompt": PROMPT},
        verbose=True 
    )
    
    app_is_ready = True
    print("Application has fully started up and is ready to serve requests.")

class Message(BaseModel):
    message: str

class FavorabilityUpdate(BaseModel):
    delta: int

@app.get("/health")
async def health_check(response: Response):
    if app_is_ready:
        return {"status": "ok"}
    else:
        response.status_code = HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready"}

@app.get("/history")
async def get_history():
    messages = memory.chat_memory.messages
    history_list = []
    for i, msg in enumerate(messages):
        msg_id = getattr(msg, 'id', None) or f"history_{i}"
        if msg.type == 'human':
            history_list.append({"user": "You", "text": msg.content, "avatar": "/images/beginner.png", "id": msg_id})
        elif msg.type == 'ai':
            history_list.append({"user": "AI Bot", "text": msg.content, "avatar": "/images/girl1.png", "id": msg_id})
    return {"history": history_list}

@app.post("/rag")
async def rag_chat(data: Message):
    current_favorability = load_favorability()
    result = qa_chain.invoke({
        "question": data.message,
        "favorability": current_favorability 
    })
    return {"response": result['answer']}

@app.get("/favorability")
async def get_favorability():
    """現在の好感度を取得"""
    favorability = load_favorability()
    return {"favorability": favorability}

@app.post("/favorability")
async def update_favorability_endpoint(data: FavorabilityUpdate):
    """好感度を更新"""
    new_favorability = update_favorability(data.delta)
    return {"favorability": new_favorability}