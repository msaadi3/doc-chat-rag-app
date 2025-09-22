from app.utils.file_processing import load_document, chunk_data, create_embeddings, embed_query
from app.core.chroma_connection import get_chroma_collection
from chromadb.api.models.Collection import Collection
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from fastapi import File, UploadFile, Depends, APIRouter
from app.core.config import settings
import uuid
import os
import aiofiles
from app.auth.dependencies import get_current_user
from app.rag.dependencies import enforce_upload_limit

router = APIRouter(
    prefix="/rag",
    tags=["RAG"],
)

# File upload
UPLOAD_DIR = "uploads/"


@router.post("/uploadfile/")
async def upload_file(file: UploadFile = File(...), collection: Collection = Depends(get_chroma_collection), user: dict = Depends(get_current_user), _=Depends(enforce_upload_limit)):
    doc_id = str(uuid.uuid4())
    file_name = f"{doc_id}_{file.filename}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file_name)

    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # 1. Load the document
    loaded_docs = load_document(file_path)

    # 2. Chunk the data
    chunked_docs = chunk_data(loaded_docs)

    # 3. Create Embeddings
    doc_embeddings = create_embeddings(chunked_docs)

    # 4. Insert into Chroma
    ids = [f"{doc_id}_{i}" for i in range(len(chunked_docs))]
    texts = [doc.page_content for doc in chunked_docs]
    metadatas = [
        {
            "document_id": doc_id,
            "filename": file.filename,
            "chunk_index": i,
            "user_email": user["email"],
        }
        for i in range(len(chunked_docs))
    ]

    collection.add(
        ids=ids,
        embeddings=doc_embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    return {"document_id": doc_id, "chunks": len(chunked_docs), "status": "indexed"}


# Retrieval Endpoint (/query/)
class QueryRequest(BaseModel):
    query: str


# Global in-memory store (replace with DB/Redis later if needed)
user_queries_history = {}  # { email: [query1, query2, ...] }


def add_user_query(user_email: str, query: str):
    if user_email not in user_queries_history:
        user_queries_history[user_email] = []
    user_queries_history[user_email].append(query)
    # optional: limit history size
    if len(user_queries_history[user_email]) > 20:
        user_queries_history[user_email].pop(0)


@router.post("/query/")
async def query_documents(
    request: QueryRequest,
    collection: Collection = Depends(get_chroma_collection), user: dict = Depends(get_current_user)
):

    #  Save the user query in history
    add_user_query(user["email"], request.query)

    #  Embed the query
    query_embedding = embed_query(request.query)

    top_k: int = 5

    #  Search in Chroma
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_email": user["email"]},
        include=["documents", "metadatas", "distances"],
    )

    # Extract matched docs
    matched_chunks = [
        {
            "text": doc,
            "metadata": meta,
            "score": score,
        }
        for doc, meta, score in zip(
            results["documents"][0], results["metadatas"][0], results["distances"][0]
        )
    ]

    #  Call LLM with context
    # context = "\n\n".join([chunk["text"] for chunk in matched_chunks])

    # Filter for relevant docs only
    relevant_chunks = [c for c in matched_chunks if c["score"] < 0.6]
    context = "\n\n".join([c["text"] for c in relevant_chunks])

    # Retrieve user queries history
    history = "\n".join(user_queries_history.get(user["email"], []))

    llm = ChatGoogleGenerativeAI(
        google_api_key=settings.gemini_api_key, model="gemini-2.5-pro", )

    prompt = f"""
    You are a helpful AI assistant.

    Your job is to:
    1. Use the provided documents if they are available and relevant.
    2. Use the user's past queries (conversation history) to understand context.
    3. If the documents are not useful, still answer the user’s question politely and naturally.
    4. Keep answers clear, concise, and accurate. Do not make up document content.

    ---
    User Query History:
    {history if history else "No prior queries."}

    Relevant Documents:
    {context if context else "No relevant documents found."}

    Current User Question:
    {request.query}

    ---
    Please provide the best possible answer below:
    """

    response = llm.invoke(prompt)

    return {
        "answer": response.content,
        "sources": matched_chunks,
    }
