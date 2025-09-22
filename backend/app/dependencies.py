from chromadb.api.models.Collection import Collection
from app.core.chroma_connection import get_chroma_collection
from fastapi import Depends, HTTPException, status
from fastapi import Depends, Request, HTTPException, status


def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


def enforce_upload_limit(collection: Collection = Depends(get_chroma_collection), user: dict = Depends(get_current_user)):
    results = collection.get(where={"user_email": user["email"]})
    existing_doc_ids = {meta["document_id"] for meta in results["metadatas"]}

    if len(existing_doc_ids) >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload limit reached (5 files max). Please delete a file before uploading a new one."
        )
    return True
