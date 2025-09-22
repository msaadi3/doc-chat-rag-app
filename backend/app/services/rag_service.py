import os
import uuid
import aiofiles
from fastapi import UploadFile, Depends, HTTPException, File
from chromadb.api.models.Collection import Collection
from langchain_google_genai import ChatGoogleGenerativeAI

from app.utils.file_utils import load_document, chunk_data, create_embeddings, embed_query
from app.core.chroma_connection import get_chroma_collection
from app.core.config import settings
from app.dependencies import get_current_user, enforce_upload_limit


UPLOAD_DIR = "uploads/"

# In-memory query history (replace with DB/Redis in prod)
user_queries_history = {}  # { email: [query1, query2, ...] }


def add_user_query(user_email: str, query: str):
    """Store recent queries in memory (max 20)."""
    if user_email not in user_queries_history:
        user_queries_history[user_email] = []
    user_queries_history[user_email].append(query)

    if len(user_queries_history[user_email]) > 20:
        user_queries_history[user_email].pop(0)


class RAGService:
    @staticmethod
    async def upload_file(
        file: UploadFile = File(...),
        collection: Collection = Depends(get_chroma_collection),
        user: dict = Depends(get_current_user),
        _=Depends(enforce_upload_limit),
    ) -> dict:
        doc_id = str(uuid.uuid4())
        file_name = f"{doc_id}_{file.filename}"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, file_name)

        # Save file asynchronously
        async with aiofiles.open(file_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        # 1. Load the document
        loaded_docs = load_document(file_path)

        # 2. Chunk the data
        chunked_docs = chunk_data(loaded_docs)

        # 3. Create embeddings
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

    @staticmethod
    async def query_documents(
        query: str,
        collection: Collection = Depends(get_chroma_collection),
        user: dict = Depends(get_current_user),
    ) -> dict:
        # Save query in history
        add_user_query(user["email"], query)

        # Embed query
        query_embedding = embed_query(query)
        top_k: int = 5

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"user_email": user["email"]},
            include=["documents", "metadatas", "distances"],
        )

        matched_chunks = [
            {"text": doc, "metadata": meta, "score": score}
            for doc, meta, score in zip(
                results["documents"][0], results["metadatas"][0], results["distances"][0]
            )
        ]

        # Filter relevant chunks
        relevant_chunks = [c for c in matched_chunks if c["score"] < 0.6]
        context = "\n\n".join([c["text"] for c in relevant_chunks])

        # User history
        history = "\n".join(user_queries_history.get(user["email"], []))

        llm = ChatGoogleGenerativeAI(
            google_api_key=settings.gemini_api_key, model="gemini-2.5-pro"
        )

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
        {query}

        ---
        Please provide the best possible answer below:
        """

        response = llm.invoke(prompt)

        return {"answer": response.content, "sources": matched_chunks}
