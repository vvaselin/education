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
    allow_origins=["http://localhost:8888"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_is_ready = False
INTIMACY_FILE = "intimacy.json"

# 親密度を読み込む関数
def load_intimacy():
    if os.path.exists(INTIMACY_FILE):
        with open(INTIMACY_FILE, "r", encoding="utf-8") as f:
            # ファイルが空の場合の対策
            content = f.read()
            if not content:
                return {"favorability": 0}
            return json.loads(content)
    return {"favorability": 0} # 初期値

# 親密度を保存する関数
def save_intimacy(data):
    with open(INTIMACY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.on_event("startup")
async def startup_event():
    global qa_chain, memory, app_is_ready, PROMPT
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    client = qdrant_client.QdrantClient(url="http://localhost:6333", prefer_grpc=True)
    vector_store = Qdrant(
        client=client, 
        collection_name="cpp_study_db",
        embeddings=embeddings
    )
    retriever = vector_store.as_retriever()
    llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    history = FileChatMessageHistory("chat_history.json")
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        chat_memory=history,
        return_messages=True,
        output_key='answer'
    )
    
    # ★修正点2: 正しいプロンプトファイルを読み込む
    with open("prompts/hakase_prompt_intimacy.txt", "r", encoding="utf-8") as f:
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
            history_list.append({"user": "AI Bot", "text": msg.content, "avatar": "/images/expert.png", "id": msg_id})
    return {"history": history_list}

@app.post("/rag")
async def rag_chat(data: Message):
    print(">>>>>>>>>>>>>> /rag ENDPOINT WAS CALLED! <<<<<<<<<<<<<<") # デバッグ用
    
    intimacy_data = load_intimacy()

    result = qa_chain.invoke({
        "question": data.message, 
        "favorability": intimacy_data.get("favorability", 0)
    })
    
    answer = result['answer']

    print("-----------------------------------------")
    print(f"LLM Raw Answer: {repr(answer)}") 
    print("-----------------------------------------")

    try:
        match = re.search(r'{.*}', answer)
        print(f"Regex Match: {match}")
        
        if match:
            favorability_change_str = match.group(0)
            print(f"Extracted JSON string: {favorability_change_str}")

            answer = answer.replace(favorability_change_str, "").strip()

            change_data = json.loads(favorability_change_str)
            change_value = change_data.get("favorability_change", 0)

            intimacy_data["favorability"] += change_value
            save_intimacy(intimacy_data)
            
            print(f"Intimacy changed by: {change_value}, new value: {intimacy_data['favorability']}")
    except Exception as e:
        print(f"An error occurred during intimacy processing: {e}")

    return {"response": answer}