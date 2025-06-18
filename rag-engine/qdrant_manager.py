def get_collection_info(self):
    """コレクション情報を取得"""
    try:
        info = self.client.get_collection(self.collection_name)
        # points_countなどは属性としてアクセスできる
        return {
            "collection": self.collection_name,
            "points_count": getattr(info, "points_count", None),
            "segments_count": getattr(info, "segments_count", None),
            "status": str(getattr(info, "status", None)),
            "optimizer_status": str(getattr(info, "optimizer_status", None)),
        }
    except Exception as e:
        return {"error": str(e)}