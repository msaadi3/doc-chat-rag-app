import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from fastapi import Depends
from app.core.config import settings

_client: ClientAPI | None = None
_collection: Collection | None = None

def get_chroma_client() -> ClientAPI:
	global _client
	if _client is None:
		_client = chromadb.CloudClient(
            api_key=settings.chroma_db_api_key,
            tenant=settings.chroma_tenant,
            database=settings.chroma_database,
        )
	return _client

def get_chroma_collection(client: ClientAPI = Depends(get_chroma_client)) -> Collection:
	global _collection
	if _collection is None:
		_collection = client.get_or_create_collection(
		    name="rag-app",
		)
	return _collection



