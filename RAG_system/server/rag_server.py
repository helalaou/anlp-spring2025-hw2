#!/usr/bin/env python3
import os
import json
import logging
from logging.handlers import RotatingFileHandler
import numpy as np
import faiss
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from dotenv import load_dotenv

# Disable proxies in Python environment
os.environ['no_proxy'] = '*'
for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']:
    if proxy_var in os.environ:
        del os.environ[proxy_var]

# Try importing openai with fallback handling
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    print("OpenAI library not available. Will use Sentence Transformers for embeddings.")
    OPENAI_AVAILABLE = False

# Load environment variables
load_dotenv()
parent_dir_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(parent_dir_env):
    print(f"Loading environment variables from parent directory: {parent_dir_env}")
    from dotenv import load_dotenv as load_parent_env
    load_parent_env(dotenv_path=parent_dir_env)

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('rag_server')

if not os.path.exists('logs'):
    os.makedirs('logs')
handler = RotatingFileHandler('logs/logs.txt', maxBytes=1024*1024, backupCount=5, mode='a')
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

# Check OpenAI API key 
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API key {'is set' if OPENAI_API_KEY else 'is NOT set'}")
if not OPENAI_API_KEY:
    print("RAG server will fall back to using Sentence Transformers for embeddings.")
    
# Load configuration from config.json
def load_config():
    # Get the path to config.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, 'config.json')
    
    # Check if config file exists
    if not os.path.exists(config_path):
        print(f"ERROR: Config file not found at {config_path}. Please create a config.json file.")
        raise FileNotFoundError(f"Config file not found at {config_path}")
    
    # Load the configuration
    try:
        with open(config_path, 'r') as f:
            full_config = json.load(f)
            
        if 'rag' in full_config:
            config = full_config['rag']
            print("Loaded RAG configuration from config.json")
        else:
            print("Missing 'rag' section in config.json")
            raise KeyError("Missing 'rag' section in config.json")
    except json.JSONDecodeError:
        print(f"ERROR: Invalid JSON format in {config_path}")
        raise
    except Exception as e:
        print(f"ERROR loading config.json: {str(e)}")
        raise
    
    # Add the OpenAI API key from environment
    config["openai_api_key"] = OPENAI_API_KEY
    
    # Force using sentence-transformers if OpenAI API key is missing
    if not config["openai_api_key"] and config['embedding']['provider'] == 'openai':
        print("WARNING: OpenAI API key is missing but provider is set to 'openai'")
        print("FORCING provider to 'sentenceTransformers' due to missing API key")
        config['embedding']['provider'] = 'sentenceTransformers'
    
    print(f"Configured embedding provider: {config['embedding']['provider']}")
    return config

# Load configuration
CONFIG = load_config()

# Extract config variables for easier access
EMBEDDING_PROVIDER = CONFIG["embedding"]["provider"]
OPENAI_API_KEY = CONFIG["openai_api_key"]
OPENAI_EMBEDDING_MODEL = CONFIG["embedding"]["openai"]["model"]
OPENAI_EMBEDDING_DIMENSION = CONFIG["embedding"]["openai"]["dimension"]
OPENAI_EMBEDDING_API_URL = CONFIG["embedding"]["openai"].get("apiUrl", "https://api.openai.com/v1") 
SENTENCE_TRANSFORMER_MODEL = CONFIG["embedding"]["sentenceTransformers"]["model"]
ST_EMBEDDING_DIMENSION = CONFIG["embedding"]["sentenceTransformers"]["dimension"]
USE_RERANKER = CONFIG["reranking"]["enabled"]
RERANKING_MODEL = CONFIG["reranking"]["model"]
RERANKING_API_URL = CONFIG["reranking"].get("apiUrl", "local")
DATA_FILE_PATH = CONFIG["data"]["filePath"]
FAISS_INDEX_PATH = CONFIG["data"]["faissIndexPath"]
NUM_RESULTS = CONFIG["data"]["numResults"]
DOC_SEPARATOR = CONFIG["data"]["separator"]

# Set the embedding dimension based on provider
if EMBEDDING_PROVIDER == 'openai':
    EMBEDDING_DIMENSION = OPENAI_EMBEDDING_DIMENSION
else:
    EMBEDDING_DIMENSION = ST_EMBEDDING_DIMENSION

# Configure OpenAI client
openai_client = None
if EMBEDDING_PROVIDER == 'openai':
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is required when embedding provider is set to 'openai'.")
    
    if not OPENAI_AVAILABLE:
        raise ImportError("OpenAI library not available. Install it with 'pip install openai'.")
    
    try:
        # Set API key in the module
        import openai
        openai.api_key = OPENAI_API_KEY
        # Set the API base URL if it's not the default
        if OPENAI_EMBEDDING_API_URL != "https://api.openai.com/v1":
            openai.api_base = OPENAI_EMBEDDING_API_URL
        print(f"✓ OpenAI API key set for model: {OPENAI_EMBEDDING_MODEL}")
        print(f"✓ Using OpenAI API URL: {OPENAI_EMBEDDING_API_URL}")
 
        # Test OpenAI embeddings
        response = openai.Embedding.create(
            model=OPENAI_EMBEDDING_MODEL,
            input=["Test"]
        )
        test_dimension = len(response["data"][0]["embedding"])
        print(f"✓ OpenAI embedding test successful. Dimension: {test_dimension}")
        
        openai_client = True
            
        # Update dimension if needed
        if test_dimension != OPENAI_EMBEDDING_DIMENSION:
            print(f"Warning: Actual dimension ({test_dimension}) doesn't match configured dimension ({OPENAI_EMBEDDING_DIMENSION})")
            EMBEDDING_DIMENSION = test_dimension
    except Exception as e:
        print(f"Error initializing OpenAI: {e}")
        raise

# FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],   
    allow_headers=["*"],   
)

# Initialize models
embedding_model = None
if EMBEDDING_PROVIDER != 'openai':
    embedding_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
    print(f"Initialized Sentence Transformer embedding model: {SENTENCE_TRANSFORMER_MODEL}")

# Initialize reranking model if needed
reranking_model = None
if USE_RERANKER:
    reranking_model = SentenceTransformer(RERANKING_MODEL)
    print(f"Initialized reranking model: {RERANKING_MODEL}")

# FAISS index and data storage
faiss_index = None
contexts = []

class Query(BaseModel):
    query: str

# Function to get OpenAI embeddings
def get_openai_embedding(text):
    if not openai_client:
        raise ValueError("OpenAI not available but get_openai_embedding was called")
    
    print(f"Getting OpenAI embedding with model {OPENAI_EMBEDDING_MODEL}")
    try:
        is_batch = isinstance(text, list)
        input_texts = text if is_batch else [text]
 
        response = openai.Embedding.create(
            model=OPENAI_EMBEDDING_MODEL,
            input=input_texts
        )
        
        # Extract embeddings
        embeddings = np.array([item["embedding"] for item in response["data"]])
        print(f"✓ Generated {len(embeddings)} OpenAI embeddings with dimension {embeddings.shape[1]}")
        
        # Return single embedding or batch depending on input
        if not is_batch:
            return embeddings[0]
        else:
            return embeddings
    except Exception as e:
        print(f"Error generating embeddings: {e}")
        raise

# Load and preprocess the data
def load_data():
    try:
        if not os.path.exists(DATA_FILE_PATH):
            print(f"Warning: Data file not found at {DATA_FILE_PATH}")
            # Create an example file
            os.makedirs(os.path.dirname(DATA_FILE_PATH), exist_ok=True)
            with open(DATA_FILE_PATH, 'w', encoding='utf-8') as file:
                file.write("Q: What is Pittsburgh known for?\nA: Pittsburgh is known for its steel industry history, three rivers (Allegheny, Monongahela, and Ohio), bridges, and sports teams like the Steelers, Pirates, and Penguins.\n\nQ: What are some famous landmarks at CMU?\nA: Carnegie Mellon University (CMU) features landmarks like the Walking to the Sky sculpture, the Gates Center for Computer Science, the Randy Pausch Memorial Bridge, and the iconic Hamerschlag Hall.")
            print(f"Created example data file at {DATA_FILE_PATH}")
        
        print(f"Loading data from {DATA_FILE_PATH}")
        with open(DATA_FILE_PATH, 'r', encoding='utf-8') as file:
            data = file.read()
        
        # Split by the configured separator
        raw_contexts = data.split(DOC_SEPARATOR)
        print(f"Split into {len(raw_contexts)} raw contexts")
        
        # Filter and clean contexts
        contexts = [context.strip() for context in raw_contexts if context.strip()]
        
        if not contexts:
            print(f"Warning: No valid contexts found in {DATA_FILE_PATH}")
            contexts = ["No data available yet. Please add documents to the data file."]
        
        print(f"Final count: {len(contexts)} contexts loaded from {DATA_FILE_PATH}")
        
        # Log a sample of contexts
        for i, ctx in enumerate(contexts[:min(5, len(contexts))]):
            print(f"\nContext {i+1} ({len(ctx)} chars):")
            print(f"{ctx[:300]}{'...' if len(ctx) > 300 else ''}")
        
        if len(contexts) > 5:
            print(f"\n... plus {len(contexts) - 5} more contexts")
        
        return contexts
    except Exception as e:
        print(f"Error loading data: {e}")
        logger.error(f"Error loading data: {e}")
        import traceback
        traceback.print_exc()
        return ["Error loading data. Please check the data file format."]

# Embed and index the data
def embed_and_index(data):
    global faiss_index, EMBEDDING_DIMENSION, embedding_model
    
    if not data:
        print("No data to embed and index")
        faiss_index = faiss.IndexFlatL2(EMBEDDING_DIMENSION)
        return [], faiss_index
    
    print(f"Embedding {len(data)} contexts...")
    print(f"Using embedding provider: {EMBEDDING_PROVIDER}")
    
    # Get embeddings based on configured provider
    if EMBEDDING_PROVIDER == 'openai':
        # Use OpenAI for embeddings
        print(f"Using OpenAI {OPENAI_EMBEDDING_MODEL} for embeddings")
        
        BATCH_SIZE = 100
        all_embeddings = []
        
        for i in range(0, len(data), BATCH_SIZE):
            print(f"Processing batch {i//BATCH_SIZE + 1}/{(len(data) + BATCH_SIZE - 1)//BATCH_SIZE}...")
            batch = data[i:i+BATCH_SIZE]
            batch_embeddings = get_openai_embedding(batch)
            all_embeddings.append(batch_embeddings)
        
        # Combine all batches
        if len(all_embeddings) == 1:
            embeddings = all_embeddings[0]
        else:
            embeddings = np.vstack(all_embeddings)
            
        dimension = embeddings.shape[1]
        
        # Ensure we're using the correct dimension
        if dimension != EMBEDDING_DIMENSION:
            print(f"Warning: Actual embedding dimension ({dimension}) doesn't match configured dimension ({EMBEDDING_DIMENSION})")
            EMBEDDING_DIMENSION = dimension
    else:
        # Use sentence_transformers for embeddings
        print(f"Using SentenceTransformer {SENTENCE_TRANSFORMER_MODEL} for embeddings")
        if embedding_model is None:
            embedding_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
        embeddings = embedding_model.encode(data)
        dimension = embeddings.shape[1]
    
    # Ensure embeddings are float32 (required by FAISS)
    embeddings = embeddings.astype(np.float32)
    
    # Create and populate FAISS index
    print(f"Creating FAISS index with dimension {dimension}...")
    index = faiss.IndexFlatL2(dimension)
    
    # Add embeddings to index
    index.add(embeddings)
    print(f"Created FAISS index with {index.ntotal} vectors of dimension {index.d}")
    
    # Save the index
    faiss_dir = os.path.dirname(FAISS_INDEX_PATH)
    if not os.path.exists(faiss_dir):
        os.makedirs(faiss_dir)
    faiss.write_index(index, FAISS_INDEX_PATH)
    print(f"FAISS index saved successfully with {index.ntotal} vectors")
    
    # Update global index
    faiss_index = index
    
    return data, faiss_index

# Rerank the results using SentenceTransformer
def rerank_results(query, candidates):
    print(f"Reranking {len(candidates)} candidates...")
    
    # Encode query and candidates using reranking model
    query_embedding = reranking_model.encode([query])
    candidate_embeddings = reranking_model.encode(candidates)

    # Compute cosine similarity scores
    scores = util.cos_sim(query_embedding, candidate_embeddings).squeeze()

    # Sort candidates by scores
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    
    for i, (candidate, score) in enumerate(ranked, start=1):
        print(f"{i}. Score: {score:.4f}, Text: {candidate[:100]}{'...' if len(candidate) > 100 else ''}")
        
    return [r[0] for r in ranked]

# Make sure data directory exists
data_dir = os.path.dirname(DATA_FILE_PATH)
if not os.path.exists(data_dir):
    os.makedirs(data_dir)
    print(f"Created directory: {data_dir}")

# Load data and create FAISS index on startup
@app.on_event("startup")
def initialize():
    global faiss_index, contexts, embedding_model
    
    # Try to load existing FAISS index
    rebuild_index = False
    if os.path.exists(FAISS_INDEX_PATH):
        print(f"Loading existing FAISS index from {FAISS_INDEX_PATH}")
        try:
            faiss_index = faiss.read_index(FAISS_INDEX_PATH)
            contexts = load_data()
            
            # Check if the index dimension matches the configured embedding dimension
            if faiss_index.d != EMBEDDING_DIMENSION:
                print(f"WARNING: FAISS index dimension ({faiss_index.d}) doesn't match configured embedding dimension ({EMBEDDING_DIMENSION})")
                print(f"This indicates the index was created with a different embedding model than what's currently configured.")
                rebuild_index = True
        except Exception as e:
            print(f"Error loading FAISS index: {e}. Will rebuild index.")
            rebuild_index = True
    else:
        print(f"Creating new FAISS index (file not found: {FAISS_INDEX_PATH})")
        rebuild_index = True
    
    # Rebuild the index if needed
    if rebuild_index:
        data = load_data()
        if data:
            contexts, faiss_index = embed_and_index(data)
            # Save the index
            idx_dir = os.path.dirname(FAISS_INDEX_PATH)
            if not os.path.exists(idx_dir):
                os.makedirs(idx_dir)
            faiss.write_index(faiss_index, FAISS_INDEX_PATH)
        else:
            # Create a placeholder index with 0 vectors
            faiss_index = faiss.IndexFlatL2(EMBEDDING_DIMENSION)
            print("Created empty FAISS index (no data found)")
    
    print("\n=== RAG Server Configuration ===")
    print(f"Embedding Provider: {EMBEDDING_PROVIDER}")
    print(f"Embedding Model: {OPENAI_EMBEDDING_MODEL if EMBEDDING_PROVIDER == 'openai' else SENTENCE_TRANSFORMER_MODEL}")
    print(f"Embedding API URL: {OPENAI_EMBEDDING_API_URL if EMBEDDING_PROVIDER == 'openai' else 'local'}")
    print(f"Embedding Dimension: {EMBEDDING_DIMENSION}")
    print(f"FAISS Index Dimension: {faiss_index.d}")
    print(f"Number of indexed documents: {len(contexts)}")
    print(f"Top-k results to return: {NUM_RESULTS}")
    print(f"Reranking enabled: {USE_RERANKER}")
    if USE_RERANKER:
        print(f"Reranking Model: {RERANKING_MODEL}")
        print(f"Reranking API URL: {RERANKING_API_URL}")
    print("=== Server initialized successfully ===\n")

# API endpoint to process queries
@app.post("/query")
def process_query(query: Query):
    global embedding_model
    
    if not faiss_index:
        raise ValueError("FAISS index not initialized. Please check server logs.")

    if not contexts:
        raise ValueError("No documents are available in the knowledge base. Please add documents.")

    print(f"\n===== Processing query: '{query.query}' =====")
    
    # Embed user query
    print(f"Generating embedding for query using {EMBEDDING_PROVIDER}")
    if EMBEDDING_PROVIDER == 'openai':
        # Use OpenAI for embeddings
        query_embedding = get_openai_embedding(query.query)
        query_embedding = query_embedding.reshape(1, -1).astype(np.float32)
    else:
        # Use sentence_transformers for embeddings
        if embedding_model is None:
            embedding_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
        query_embedding = embedding_model.encode([query.query]).astype(np.float32)

    # Verify FAISS index dimension
    print(f"FAISS index dimension: {faiss_index.d}, vectors: {faiss_index.ntotal}")
    
    # Verify embedding dimension matches index dimension
    if query_embedding.shape[1] != faiss_index.d:
        # Provide a more helpful error message
        error_message = (
            f"Query embedding dimension ({query_embedding.shape[1]}) doesn't match FAISS index dimension ({faiss_index.d}). "
            f"This indicates the index was created with a different embedding model than what's currently configured. "
            f"To fix this, you should:\n"
            f"1. Check your config.json and ensure 'embedding.provider' is set correctly\n"
            f"2. Delete the existing index file at {FAISS_INDEX_PATH}\n"
            f"3. Restart the RAG server to rebuild the index with the correct model\n"
            f"Alternatively, modify your config to match the model used to create the index."
        )
        print(error_message)
        raise ValueError(error_message)
    
    # Retrieve top-N matches
    print(f"Retrieving top {NUM_RESULTS} matches from FAISS index...")
    distances, indices = faiss_index.search(query_embedding, min(NUM_RESULTS, faiss_index.ntotal))
    
    # Get top matches
    top_matches = []
    for i, (idx, dist) in enumerate(zip(indices[0], distances[0]), start=1):
        if idx != -1 and idx < len(contexts):
            match_text = contexts[idx]
            print(f"\nMatch {i}. Distance: {dist:.4f}")
            print(f"Document: {match_text}")
            top_matches.append(match_text)
        
    # Check if we found any matches
    if not top_matches:
        return {
            "query": query.query,
            "context": "No relevant information found in the knowledge base for this query."
        }

    # Join all relevant contexts
    if USE_RERANKER and len(top_matches) > 1:
        # Rerank results
        reranked_results = rerank_results(query.query, top_matches)
        combined_context = "\n\n".join(reranked_results)
    else:
        combined_context = "\n\n".join(top_matches)
    
    return {
        "query": query.query,
        "context": combined_context
    }

# Add a health endpoint
@app.get("/health")
def health_check():
    """Health check endpoint to verify the RAG server is running correctly."""
    try:
        status = "ok"
        message = "RAG server is operational"
        
        # Check if FAISS index is initialized
        if not faiss_index:
            status = "warning"
            message = "FAISS index not initialized"
        elif faiss_index.ntotal == 0:
            status = "warning"
            message = "FAISS index is empty (no vectors)"
        
        # Get more detailed status info
        index_stats = {
            "vectors": faiss_index.ntotal if faiss_index else 0,
            "dimension": faiss_index.d if faiss_index else 0,
            "contexts": len(contexts)
        }
        
        # Embedding configuration details
        embedding_config = {
            "provider": EMBEDDING_PROVIDER,
            "model": OPENAI_EMBEDDING_MODEL if EMBEDDING_PROVIDER == 'openai' else SENTENCE_TRANSFORMER_MODEL,
            "dimension": EMBEDDING_DIMENSION,
            "apiUrl": OPENAI_EMBEDDING_API_URL if EMBEDDING_PROVIDER == 'openai' else "local"
        }
        
        # Reranking configuration details
        reranking_config = {
            "enabled": USE_RERANKER,
            "model": RERANKING_MODEL if USE_RERANKER else "Not enabled",
            "apiUrl": RERANKING_API_URL
        }
        
        # Return configuration and status
        return {
            "status": status,
            "message": message,
            "embedding": embedding_config,
            "reranking": reranking_config,
            "index_stats": index_stats,
            "data": {
                "document_separator": DOC_SEPARATOR,
                "data_file": DATA_FILE_PATH,
                "faiss_index_path": FAISS_INDEX_PATH,
                "num_results": NUM_RESULTS
            }
        }
    except Exception as e:
        print(f"Error in health check: {e}")
        return {
            "status": "error",
            "message": f"Error in health check: {str(e)}"
        }

@app.get("/reset-index")
def reset_index():
    """Reset the FAISS index and force a rebuild on next startup."""
    try:
        # Check if index file exists
        if os.path.exists(FAISS_INDEX_PATH):
            # Delete the index file
            os.remove(FAISS_INDEX_PATH)
            print(f"Deleted FAISS index file at {FAISS_INDEX_PATH}")
            return {
                "status": "success",
                "message": f"FAISS index at {FAISS_INDEX_PATH} has been deleted. The index will be rebuilt on next server startup."
            }
        else:
            return {
                "status": "info",
                "message": f"FAISS index file not found at {FAISS_INDEX_PATH}. No action needed."
            }
    except Exception as e:
        print(f"Error resetting index: {e}")
        return {
            "status": "error",
            "message": f"Error resetting index: {str(e)}"
        } 