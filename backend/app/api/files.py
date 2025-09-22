# from fastapi import APIRouter, Depends, HTTPException
# from app.core.chroma_connection import get_chroma_collection
# from chromadb.api.models.Collection import Collection
# from app.dependencies import get_current_user

# router = APIRouter(prefix="/files", tags=["Files"])


# @router.get("/get-files")
# async def get_user_files(
#     collection: Collection = Depends(get_chroma_collection),
#     user: dict = Depends(get_current_user)
# ):
#     # Query all documents for this user
#     results = collection.get(where={"user_email": {"$eq": user["email"]}})

#     files = {}
#     for meta in results["metadatas"]:
#         doc_id = meta["document_id"]
#         filename = meta["filename"]
#         if doc_id not in files:
#             files[doc_id] = filename  # only store once per doc_id

#     return {"files": [{"document_id": k, "filename": v} for k, v in files.items()]}


# @router.delete("/delete-file/{document_id}")
# async def delete_file(
#     document_id: str,
#     collection: Collection = Depends(get_chroma_collection),
#     user: dict = Depends(get_current_user)
# ):
#     # Get all chunks for this document
#     results = collection.get(where={
#         "$and": [
#             {"user_email": {"$eq": user["email"]}},
#             {"document_id": {"$eq": document_id}}
#         ]
#     })

#     if not results["ids"]:
#         raise HTTPException(status_code=404, detail="File not found")

#     # Delete by IDs
#     collection.delete(ids=results["ids"])
#     return {"status": "deleted", "document_id": document_id}


from fastapi import APIRouter, Depends
from chromadb.api.models.Collection import Collection
from app.services.file_service import FileService
from app.core.chroma_connection import get_chroma_collection
from app.dependencies import get_current_user

router = APIRouter(prefix="/files", tags=["Files"])


@router.get("/get-files")
async def get_user_files(
    collection: Collection = Depends(get_chroma_collection),
    user: dict = Depends(get_current_user),
):
    return await FileService.get_user_files(collection=collection, user=user)


@router.delete("/delete-file/{document_id}")
async def delete_file(
    document_id: str,
    collection: Collection = Depends(get_chroma_collection),
    user: dict = Depends(get_current_user),
):
    return await FileService.delete_file(document_id=document_id, collection=collection, user=user)
