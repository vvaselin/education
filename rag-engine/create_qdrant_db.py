import requests
from bs4 import BeautifulSoup
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import Qdrant
from dotenv import load_dotenv

load_dotenv()

def main():
    # --- 1. cpprefjpからデータを読み込む ---
    # リンク切れでないURLのリスト
    urls = [
        "https://cpprefjp.github.io/reference/string/basic_string.html",
        "https://cpprefjp.github.io/reference/vector.html",
        "https://cpprefjp.github.io/reference/memory/unique_ptr.html",
        "https://cpprefjp.github.io/reference/iostream.html",
        "https://cpprefjp.github.io/reference/algorithm.html",
        "https://cpprefjp.github.io/lang/cpp26.html",
        "https://cpprefjp.github.io/lang/cpp23.html",
        "https://cpprefjp.github.io/reference/iostream.html",
        "https://cpprefjp.github.io/reference/iostream/cin.html",
        "https://cpprefjp.github.io/reference/iostream/cout.html",
    ]

    print("Loading documents from web...")
    all_documents = []
    for url in urls:
        try:
            response = requests.get(url, headers={'User-Agent': 'My Scraper Bot 1.0'})
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # ユーザーが特定した正しいコンテナ <main id="main"> を指定する
            main_content = soup.find("main", id="main")
            
            if main_content:
                page_text = main_content.get_text(separator="\n", strip=True)
                document = Document(page_content=page_text, metadata={"source": url})
                all_documents.append(document)
                print(f"Successfully scraped content from {url}")
            else:
                print(f"Warning: Could not find content for url: {url}")

        except requests.exceptions.RequestException as e:
            print(f"An error occurred while fetching {url}: {e}")

    if not all_documents:
        print("Error: No documents were loaded. Exiting.")
        return

    # --- 2. テキストを分割 ---
    print("\nSplitting documents...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    splits = text_splitter.split_documents(all_documents)
    print(f"Split into {len(splits)} chunks.")

    # --- 3. ベクトル化してQdrantに保存 ---
    print("Embedding and storing in Qdrant...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    Qdrant.from_documents(
        splits,
        embeddings,
        url="http://localhost:6333",
        prefer_grpc=True,
        collection_name="cpp_study_db",
        force_recreate=True, # 既に存在する場合は一度削除して作り直す
    )

    print("\nSuccessfully stored documents in Qdrant collection 'cpp_study_db'.")

if __name__ == "__main__":
    main()