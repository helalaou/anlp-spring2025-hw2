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
