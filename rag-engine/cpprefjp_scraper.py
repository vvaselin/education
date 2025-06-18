import requests
from bs4 import BeautifulSoup
import json
import time
from typing import List, Dict, Any
import re

class CppRefjpScraper:
    def __init__(self):
        self.base_url = "https://cpprefjp.github.io"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def get_sitemap(self) -> List[str]:
        """サイトマップからURL一覧を取得"""
        try:
            response = self.session.get(f"{self.base_url}/sitemap.xml")
            soup = BeautifulSoup(response.content, 'xml')
            urls = []
            
            for loc in soup.find_all('loc'):
                url = loc.text
                # C++リファレンスページのみを対象
                if '/reference/' in url or '/lang/' in url:
                    urls.append(url)
            
            return urls
        except Exception as e:
            print(f"サイトマップ取得エラー: {e}")
            return []
    
    def scrape_page(self, url: str) -> Dict[str, Any]:
        """個別ページをスクレイピング"""
        try:
            response = self.session.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # タイトルを取得
            title = soup.find('title')
            title_text = title.text.strip() if title else "Unknown"
            
            # メインコンテンツを取得
            main_content = soup.find('main') or soup.find('article') or soup.find('div', class_='content')
            
            if not main_content:
                return None
            
            # テキストを抽出
            content_text = main_content.get_text(separator=' ', strip=True)
            
            # 不要な空白を削除
            content_text = re.sub(r'\s+', ' ', content_text).strip()
            
            # カテゴリを判定
            category = "reference"
            if "/lang/" in url:
                category = "language"
            elif "/reference/" in url:
                category = "reference"
            
            return {
                "title": title_text,
                "content": content_text,
                "url": url,
                "category": category
            }
            
        except Exception as e:
            print(f"ページスクレイピングエラー {url}: {e}")
            return None
    
    def scrape_all(self, max_pages: int = 50) -> List[Dict[str, Any]]:
        """全ページをスクレイピング"""
        urls = self.get_sitemap()
        print(f"取得したURL数: {len(urls)}")
        
        data = []
        for i, url in enumerate(urls[:max_pages]):
            print(f"スクレイピング中: {i+1}/{min(len(urls), max_pages)} - {url}")
            
            page_data = self.scrape_page(url)
            if page_data and len(page_data["content"]) > 100:  # 最小文字数チェック
                data.append(page_data)
            
            # サーバーに負荷をかけないよう少し待機
            time.sleep(0.5)
        
        return data
    
    def save_data(self, data: List[Dict[str, Any]], filename: str = "cpprefjp_data.json"):
        """データをJSONファイルに保存"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"データを {filename} に保存しました")
    
    def load_data(self, filename: str = "cpprefjp_data.json") -> List[Dict[str, Any]]:
        """JSONファイルからデータを読み込み"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"ファイル {filename} が見つかりません")
            return []

if __name__ == "__main__":
    scraper = CppRefjpScraper()
    
    # データをスクレイピング
    print("cpprefjpからデータを取得中...")
    data = scraper.scrape_all(max_pages=20)  # テスト用に20ページまで
    
    if data:
        scraper.save_data(data)
        print(f"取得完了: {len(data)}ページ")
    else:
        print("データの取得に失敗しました")