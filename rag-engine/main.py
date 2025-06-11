from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEndpoint
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

app = FastAPI()

# (CORS設定は省略)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8888"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RAGの仕組みを構築 ---

# (ドキュメント読み込み、ベクトル化の部分は省略)
loader = TextLoader("docs/cpp.txt", encoding="utf-8")
documents = loader.load()
text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
docs = text_splitter.split_documents(documents)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = FAISS.from_documents(docs, embeddings)
retriever = db.as_retriever()


# 4. LLM（大規模言語モデル）の準備
llm = HuggingFaceEndpoint(
    repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
    task="text-generation",
    max_new_tokens=512, # 安全装置として余裕を持った値に戻す
    do_sample=False,
)

# 5. プロンプトをファイルから読み込む
with open("prompts/hakase_prompt.txt", "r", encoding="utf-8") as f:
    prompt_template = f.read()

PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)

# 6. RAGチェーンの作成
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": PROMPT},
    return_source_documents=False
)

# (入力スキーマとエンドポイント部分は省略)
class Message(BaseModel):
    message: str

@app.get("/health")
async def health_check():
    """サーバーが正常に起動しているか確認するためのエンドポイント"""
    return {"status": "ok"}

@app.post("/rag")
async def rag_chat(data: Message):
    print("受け取ったデータ:", data)
    result = qa_chain.invoke({"query": data.message})
    return {"response": result['result']}