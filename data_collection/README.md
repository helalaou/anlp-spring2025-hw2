# ANLP - HW2: Web Crawler and Q&A Generator

## Features

- BFS-based web crawling with depth limiting
- PDF text extraction
- Text cleaning and processing
- Q&A generation using Ollama's llama3.1:8b model
- Sequential processing of each source with immediate Q&A generation

## Setup

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

3. **Set up Ollama:**
   - Make sure you have Ollama installed and running locally
   - Pull the llama3.1:8b model using: `ollama pull llama3.1:8b`
   - Ensure Ollama is running on the default port (11434)

4. **Prepare the data:**
   - Place URLs to crawl in `data_sources/urls/urls.txt` (one URL per line)
   - Place PDF files to process in `data_sources/files/`

## Usage

Run the notebook.
 
The script will:
1. Process each PDF file in `data_sources/files/` individually
   - For each PDF: extract text, generate Q&A, save results
2. Process each URL in `urls.txt` individually
   - For each URL: perform BFS crawling, generate Q&A, save results
   - PDFs found during web crawling are included in the same Q&A output as the website

## Processing Flow

The script processes sources sequentially:

1. PDF Processing:
   - Extract text from each PDF
   - Generate Q&A immediately for that PDF using Ollama's llama3.1:8b model
   - Save Q&A to a file before moving to the next PDF

2. URL Processing:
   - Crawl each website using BFS
   - Include PDFs found during crawling with the source website
   - Generate Q&A immediately after crawling completes
   - Save Q&A to a file before moving to the next URL

## Configuration

You can modify the following parameters in the script:

- `max_depth`: Maximum depth for BFS crawling (default: 2)
- `max_pages`: Maximum number of pages to crawl per domain (default: 20)
- `chunk_size`: Size of text chunks for Q&A generation (default:3000 words)

## Output

script generates text files in the `qa_outputs/` directory:
- For URLs: `QA_domain_name.txt`
- For PDFs: `QA_pdf_filename.txt`

Each file contains Q&A pairs in the format:

```
Q: Question?
A: Answer

Q: Another question?
A: Another answer
```

## Directory Structure

```
project/
├── crawler.ipynb          # Main script
├── requirements.txt       # Dependencies
├── data_sources/
│   ├── urls/
│   │   └── urls.txt       # List of seed URLs
│   └── files/             # PDF files to process
└── qa_outputs/            # Generated Q&A files
```

## Notes

- code implements rate limiting and error handling to avoid overwhelming servers.
- BFS is limited by depth and maximum pages to prevent excessive crawling.
- text is cleaned and normalized before Q&A generation.
- PDFs found during web crawling are included with their source website in its Q&A output. 