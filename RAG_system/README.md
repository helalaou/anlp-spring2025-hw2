# ANLP - HW2: RAG System

A Retrieval-Augmented Generation (RAG) system designed for factual question-answering about Pittsburgh and Carnegie Mellon University (CMU). This application focuses specifically on questions about various facts concerning Pittsburgh and CMU, using a knowledge base of relevant documents to provide accurate answers.

## Features

- Question-answering interface for Pittsburgh and CMU-related factual queries
- Retrieval-Augmented Generation (RAG) to provide accurate, context-based answers
- Chat model support for both OpenAI and Ollama LLM providers
- Flexible embedding options using either OpenAI or Sentence Transformers

## Architecture

The application consists of two main components:

1. **Node.js Server**: Handles question-answering requests and communicates with either OpenAI API or Ollama API based on configuration
2. **Python RAG Server**: Provides document retrieval using FAISS vector database with configurable embedding providers

## Prerequisites

- Node.js (v16+)
- Python (3.8+)
- **OpenAI API key** (if using OpenAI for embeddings or chat - get one at https://platform.openai.com/api-keys)
- Ollama installed locally (if using Ollama)

### OpenAI Setup (Recommended)

For optimal performance, we recommend using OpenAI's models:

1. Get an API key from the [OpenAI API Keys page](https://platform.openai.com/api-keys)
2. Create a `.env` file in the project root (the setup script will help with this)
3. Add your API key to the `.env` file: `OPENAI_API_KEY=your_key_here`
The OpenAI API key should be added directly without any quotes around it. 

## Quick Start

For the quickest setup experience, use our deployment script:

1. Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/helalaou/anlp-spring2025-hw2
cd anlp-spring2025-hw2/rag_system
```

2. Create a `.env` file in the server directory with your OpenAI API key:
```bash
cd server
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env  # IMPORTANT: No quotes around the API key
cd ..
```

3. Run the deployment script to install all dependencies and start the application:
```bash
./deploy.sh
```

The deployment script `deploy.sh` automates the entire setup process. It:
- Makes sure all required scripts are executable
- Installs all dependencies for both the Node.js and Python components
- Sets up the necessary environment
- Starts all servers and the client application

The application will be accessible at http://localhost:3000.

## Configuration Guide

The system uses a central configuration file to control all settings:

### config.json

This file (located at `server/config.json`) controls all aspects of the application, including:


1. **Server Settings**:
   - `server.port`: The port for the Node.js server
   - `server.faissApiUrl`: URL to connect to the Python RAG server

2. **RAG Settings**:
   - `rag.embedding.provider`: Choose between `"openai"` or `"sentenceTransformers"`
   - `rag.embedding.openai.model`: The OpenAI embedding model to use
   - `rag.embedding.sentenceTransformers.model`: The sentence transfoemers embedding model to use
   - `rag.data.numResults`: Number of similar documents to retrieve (top-k)
   - `rag.data.separator`: The separator used to split documents in your data file

3. **Chat Settings**:
   - `chat.provider`: Choose between `"openai"` or `"ollama"`
   - `chat.openai.model`: The OpenAI model to use for chat (e.g., `"gpt-4o"`)
   - `chat.ollama.model`: The local Ollama model to use
   - `chat.systemPrompt`: The system prompt that guides the model's behavior

> **Important**: If you change the embedding provider in config.json, you must delete the existing FAISS index for the changes to take effect. The system will use the existing index if available, which would have been created with the previous embedding model. Delete the file at the path specified in `rag.data.faissIndexPath` (default: `data/faiss_index.idx`).

### Adding or Updating Knowledge Base Content

To add or update content in the knowledge base:

1. Edit the data file specified in `rag.data.filePath` (default: `server/data/data.txt`)
2. Format your data with questions and answers separated by the document separator (`\n\n` by default)
3. Delete the existing FAISS index so it will be rebuilt with the new data
4. Restart the application

Example data format:
```
Q: What is Pittsburgh known for?
A: Pittsburgh is known for its steel industry history, three rivers, and bridges.

Q: What are some famous landmarks at CMU?
A: CMU features landmarks like the Walking to the Sky sculpture and Gates Center.
```

## Manual Setup and Running

If you prefer to set up and run the components separately, follow these instructions:

### 1. Environment Setup

Create a `.env` file in the server directory with your API key (if using OpenAI):

```bash
cd server
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
cd ..
```

The `.env` file is only used for the OpenAI API key. All other configuration is done directly in the config.json file.

### 2. Install Dependencies

Run the installation script to set up all required dependencies:

```bash
./install.sh
```

This script will:
- Create a Python virtual environment in the server directory
- Install Python dependencies from requirements.txt
- Install Node.js dependencies for both the client and server

### 3. Data Preparation

Add your text data to `server/data/data.txt`. This data will be used by the RAG server to provide context for the question-answering system. Ensure your data contains relevant information about Pittsburgh and CMU.

### 4. Run the Application

Start all components of the application with:

```bash
./run.sh
```

This script will:
- Activate the Python virtual environment
- Start the FastAPI server for document retrieval
- Start the Node.js server for handling client requests
- Launch the React client application

The client will be available at http://localhost:3000.

## About

This project was developed for the CMU Advanced Natural Language Processing graduate course, Assignment 2. It implements a factual question-answering system using retrieval-augmented generation to provide accurate answers about Pittsburgh and CMU.

# External Code Use

This Pittsburgh & CMU Knowledge Base system was built from scratch, using industry-standard tools and libraries to support its functionality. These include Node.js and React for the server and client applications, FastAPI for the backend API, FAISS for vector similarity search, Sentence Transformers for embeddings and reranking, and OpenAI/Ollama for language model integration. All other code, including system architecture, question-answering logic, and UI, was custom-developed for this project.

## Project Structure

The project consists of a client-side React application and a server-side Node.js application that communicates with a FastAPI server for FAISS (Facebook AI Similarity Search) indexing and retrieval.

- `client/`: Contains the React application code.
- `server/`: Contains the Node.js server code and the FastAPI server for FAISS.

## Configuration

The project uses configuration files to manage various settings:

- `client/src/config.js`: Configuration for the client-side application.
  - `serverUrl`: The URL of the Node.js server that the client communicates with.
  - `app`: Object containing the application name and version.
  - `llm`: Object containing the timeout value for the language model requests.

- `server/config.js`: Configuration for the Node.js server.
  - `server`: Object containing the server port, API URLs for OpenAI and Ollama, and FAISS API URL.
  - `client`: Object containing the client port.
  - `llm`: Object containing the provider, model names, and timeout values.
  - `app`: Object containing the application name and version.

- `server/rag_config.py`: Configuration for the FastAPI server and FAISS.
  - `DATA_FILE_PATH`: Path to the text file containing the data to be indexed.
  - `EMBEDDING_PROVIDER`: Provider to use for embeddings (OpenAI or Sentence Transformers).
  - `EMBEDDING_MODEL`: Specific model to use for embedding generation.
  - `USE_RERANKER`: Boolean flag to enable or disable the reranker.
  - `RERANKING_MODEL`: Name of the sentence transformer model to be used for reranking.
  - `FAISS_INDEX_PATH`: Path to save the FAISS index file.
  - `NUM_RESULTS`: Number of top results to retrieve from the FAISS index.

Make sure to review and update these configuration files as needed, especially for setting the correct ports, paths, and model names.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/helalaou/anlp-spring2025-hw2
   cd anlp-spring2025-hw2
   ```

2. Make the scripts executable (for Unix-based systems (Linux, macOS) only):
     ```
     chmod +x install.sh
     chmod +x run.sh
     chmod +x deploy.sh
     ```

3. For quick installation and startup, use the deploy script:
   ```
   ./deploy.sh
   ```

   Or to install dependencies only:
   ```
   ./install.sh
   ```

## Running the Application

To start all components of the application, run the `run.sh` script from the project root directory:

```
./run.sh
```

This script will:
   - Activate the Python virtual environment
   - Start the FastAPI server for FAISS
   - Start the Node.js server
   - Start the React application

The application will be accessible at `http://localhost:3000`.

To stop the application, press `[ENTER]` in the terminal where the `run.sh` script is running.

## Server Components

### Node.js Server

The Node.js server (`server/server.js`) acts as an intermediary between the client application and the FastAPI server. It handles requests for generating responses using a language model via either OpenAI or Ollama, and communicates with the FastAPI server for FAISS indexing and retrieval.

### Language Model Integration

The system supports two language model providers:

1. **OpenAI**: Uses the OpenAI API for both chat completions and embeddings
2. **Ollama**: Uses locally-hosted models for chat completions, with the option to use Sentence Transformers for embeddings

The choice of provider can be configured in the `.env` file or directly in the configuration files.

### RAG Server

The RAG (Retrieval-Augmented Generation) server is built with FastAPI and provides document retrieval functionality using FAISS vector search. It embeds the documents and queries, then finds the most relevant documents to provide as context for answering questions.

## License

This project is licensed under the [MIT License](LICENSE).
