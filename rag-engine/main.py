from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings  # 修正点
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEndpoint
import os
from dotenv import load_dotenv  # 追加

# .envファイルから環境変数を読み込む
load_dotenv() # 追加

app = FastAPI()

# CORS設定（Next.jsからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RAGチェーンの構築 ---
loader = TextLoader("docs/cpp.txt", encoding="utf-8")
documents = loader.load()

text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
docs = text_splitter.split_documents(documents)

# 修正点: HuggingFaceBgeEmbeddings -> HuggingFaceEmbeddings
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

db = FAISS.from_documents(docs, embeddings)

retriever = db.as_retriever()
HUGGINGFACEHUB_API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")

# 修正点: 引数の渡し方を変更
llm = HuggingFaceEndpoint(
    repo_id="google/flan-t5-base",
    temperature=0.5,
    max_length=512,
    huggingfacehub_api_token=HUGGINGFACEHUB_API_TOKEN
)

qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

# --- 入力スキーマ ---
class Message(BaseModel):
    message: str

# --- エンドポイント ---
@app.post("/rag")
async def rag_chat(data: Message):
    print("受け取ったデータ:", data)
    result = qa_chain.invoke({"query": data.message})
    return {"response": result['result']}