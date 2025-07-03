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
# from langchain_huggingface import HuggingFaceEndpoint
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv
import qdrant_client
from langchain_qdrant import Qdrant
import json


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
INTIMACY_FILE = "intimacy.json"

def get_intimacy() -> int:
    """親密度をJSONファイルから読み込む"""
    try:
        with open(INTIMACY_FILE, "r") as f:
            data = json.load(f)
            return data.get("value", 0)
    except (FileNotFoundError, json.JSONDecodeError):
        return 0

def save_intimacy(value: int):
    """親密度をJSONファイルに書き込む"""
    with open(INTIMACY_FILE, "w") as f:
        json.dump({"value": value}, f)

def update_intimacy(message: str):
    """メッセージ内容に基づいて親密度を更新する"""
    current_intimacy = get_intimacy()
    
    # 簡単なキーワードベースの親密度判定
    positive_keywords = ["ありがとう", "すごい", "助かる", "面白い", "楽しい"]
    if any(keyword in message for keyword in positive_keywords):
        new_intimacy = current_intimacy + 1
        save_intimacy(new_intimacy)
        print(f"親密度が {current_intimacy} -> {new_intimacy} に上昇しました。")

@app.on_event("startup")
async def startup_event():
    global qa_chain, memory, app_is_ready

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    client = qdrant_client.QdrantClient(url="http://localhost:6333", prefer_grpc=True)

    vector_store = Qdrant(
        client=client, 
        collection_name="cpp_study_db", # create_qdrant_db.pyで指定したコレクション名
        embeddings=embeddings
    )

    #db = FAISS.from_documents(docs, embeddings)
    retriever = vector_store.as_retriever()

    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

    history = FileChatMessageHistory("chat_history.json")
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        chat_memory=history,
        return_messages=True,
        output_key='answer'
    )

    with open("prompts/hakase_prompt.txt", "r", encoding="utf-8") as f:
        prompt_template = f.read()

    PROMPT = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
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
    for msg in messages:
        msg_id = getattr(msg, 'id', None)
        if msg.type == 'human':
            history_list.append({"user": "You", "text": msg.content, "avatar": "/images/beginner.png", "id": msg_id})
        elif msg.type == 'ai':
            history_list.append({"user": "AI Bot", "text": msg.content, "avatar": "/images/expert.png", "id": msg_id})
    return {"history": history_list}

@app.post("/rag")
async def rag_chat(data: Message):
    update_intimacy(data.message)

    result = qa_chain.invoke({"question": data.message})
    return {"response": result['answer']}

@app.get("/intimacy")
async def get_intimacy_endpoint():
    """現在の親密度の値を取得する"""
    return {"intimacy": get_intimacy()}