from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import uuid
import os
import aiofiles
from app.utils.file_processing import load_document, chunk_data, create_embeddings, embed_query
from app.core.chroma_connection import get_chroma_collection
from chromadb.api.models.Collection import Collection
from app.core.chroma_connection import get_chroma_collection
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings

# Initialize logging
logging.basicConfig(level=logging.ERROR, filename='logs.txt')

# Initialize FastAPI app
app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# file upload
UPLOAD_DIR = "uploads/"


@app.post("/uploadfile/")
async def upload_file(file: UploadFile = File(...), collection: Collection = Depends(get_chroma_collection)):
    doc_id = str(uuid.uuid4())
    file_name = f"{doc_id}_{file.filename}"
    # file_path = f"uploads/{file_name}"
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
    top_k: int = 5


@app.post("/query/")
async def query_documents(
    request: QueryRequest,
    collection: Collection = Depends(get_chroma_collection)
):
    # 1. Embed the query
    query_embedding = embed_query(request.query)

    # 2. Search in Chroma
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=request.top_k,
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

    # 3. Call LLM with context
    context = "\n\n".join([chunk["text"] for chunk in matched_chunks])
    llm = ChatGoogleGenerativeAI(
        google_api_key=settings.gemini_api_key, model="gemini-2.5-pro", )

    prompt = f"""You are an assistant. Use the following context to answer the user’s question:

    Context:
    {context}

    Question:
    {request.query}

    Answer:"""

    response = llm.invoke(prompt)

    return {
        "query": request.query,
        "answer": response.content,
        "sources": matched_chunks,
    }
