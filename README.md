# CMU Advanced NLP - Assignment 2: End-to-end NLP System Building

A comprehensive Retrieval-Augmented Generation (RAG) system designed for factual question-answering about Pittsburgh and Carnegie Mellon University (CMU). This project includes both the RAG system infrastructure and the data collection tools used to build the knowledge base. Users can interact with the system through a React-based chat interface.

## About

This project was developed for the CMU Advanced Natural Language Processing graduate course, Assignment 2. It implements a factual question-answering system using retrieval-augmented generation to provide accurate answers about Pittsburgh and CMU.

## Project Overview

This project consists of two main components:

1. **RAG System**: A full-stack application that provides accurate answers to questions about Pittsburgh and CMU by leveraging a knowledge base of relevant documents.

2. **Data Collection Tools**: Web crawling and document processing tools that gather information from various sources and generate question-answer pairs for the knowledge base.

## RAG System Features

- Interactive chat interface built with React for a user-friendly question-answering experience
- Real-time conversational interaction with the knowledge base
- Question-answering interface for Pittsburgh and CMU-related factual queries
- Retrieval-Augmented Generation to provide accurate, context-based answers
- Dual-provider support: OpenAI and Ollama for the language model backend
- Flexible embedding options using either OpenAI or Sentence Transformers
- Complete web interface for user interaction

### Architecture

The RAG system consists of three main components:

1. **React Frontend**: User-friendly chat interface for asking questions and receiving answers in a conversational format
2. **Node.js Server**: Handles question-answering requests and communicates with LLM providers
3. **Python RAG Server**: Provides document retrieval using FAISS vector database

## Data Collection Features

- BFS-based web crawling with depth limiting
- PDF text extraction
- Text cleaning and processing
- Q&A generation using OpenAI's GPT-4o model
- Sequential processing of sources with immediate Q&A generation

## Quick Start Guide

### Prerequisites

- Node.js (v16+)
- Python (3.8+)
- OpenAI API key (optional but recommended for best performance)
- Ollama installed locally (optional alternative to OpenAI)

### Setting Up and Running the RAG System

1. Clone the repository and navigate to the project directory:
```bash
git clone https://github.com/helalaou/anlp-spring2025-hw2
cd anlp-spring2025-hw2
```

2. Create a `.env` file in the RAG_system/server directory with your OpenAI API key:
```bash
cd RAG_system/server
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env  # No quotes around the API key
cd ../..
```

3. Run the deployment script from the RAG_system directory:
```bash
cd RAG_system
./deploy.sh
```

4. The application will be accessible at http://localhost:3000

### Using the Data Collection Tools

1. Navigate to the data_collection directory:
```bash
cd data_collection
```

2. Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your OpenAI API key in a `.env` file:
```bash
echo "OPENAI_KEY=your_openai_api_key" > .env
```

4. Add URLs to crawl in `data_sources/urls/urls.txt` and/or PDF files in `data_sources/files/`

5. Run the crawler notebook to generate Q&A pairs

## Project Structure

```
anlp-spring2025-hw2/
├── RAG_system/                # Main RAG application
│   ├── client/                # React frontend
│   ├── server/                # Node.js server + Python RAG server
│   ├── deploy.sh              # One-click deployment script
│   ├── install.sh             # Dependencies installation script
│   └── run.sh                 # Script to run all components
│
└── data_collection/           # Data gathering and processing tools
    ├── crawler.ipynb          # Web crawling and Q&A generation notebook
    ├── data_sources/          # Input URLs and PDF files
    ├── qa_outputs/            # Generated Q&A outputs
    └── requirements.txt       # Python dependencies
```

## Configuration

The system is highly configurable:

- **RAG System**: Edit `RAG_system/server/config.json` to configure LLM providers, embedding models, and other settings
- **Data Collection**: Parameters can be adjusted in the crawler notebook

## Further Documentation

Each component of this project includes its own README file in its respective directory:

- **[RAG System Documentation](RAG_system/README.md)**: details about the RAG system architecture, configuration options, deployment methods, and usage instructions.
- **[Data Collection Documentation](data_collection/README.md)**: details about the web crawling process, PDF extraction, question-answer generation, and data processing workflows.

## License

This project is licensed under the [MIT License](LICENSE). 
