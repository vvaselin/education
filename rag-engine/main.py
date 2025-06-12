from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_503_SERVICE_UNAVAILABLE # ★ ステータスコード用に追加
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

load_dotenv()
app = FastAPI()

# ★ アプリケーションが本当に準備完了したかを管理するフラグ
app_is_ready = False

@app.on_event("startup")
async def startup_event():
    """アプリケーションの起動時に一度だけ実行される処理"""
    global qa_chain, memory, app_is_ready
    
    # --- RAGの仕組みを構築（重い処理なので起動時に一度だけ行う） ---
    loader = TextLoader("docs/cpp.txt", encoding="utf-8")
    documents = loader.load()
    text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = text_splitter.split_documents(documents)
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.from_documents(docs, embeddings)
    retriever = db.as_retriever()

    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    
    #llm = HuggingFaceEndpoint(
    #    repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
    #    task="text-generation",
    #    max_new_tokens=512,
    #    do_sample=False,
    #)
    
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
    
    # ★ 全ての準備が終わったので、フラグをTrueにする
    app_is_ready = True
    print("Application has fully started up and is ready to serve requests.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    message: str

# --- エンドポイント定義 ---

@app.get("/health")
async def health_check(response: Response):
    """サーバーがリクエストを処理できる状態か確認するエンドポイント"""
    if app_is_ready:
        return {"status": "ok"}
    else:
        # 準備ができていない場合は 503 Service Unavailable を返す
        response.status_code = HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "not_ready"}

@app.get("/history")
async def get_history():
    # ... (変更なし)
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
    result = qa_chain.invoke({"question": data.message})
    return {"response": result['answer']}