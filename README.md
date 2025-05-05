# ReadWise - Article Summarizer

ReadWise is a web application that helps users summarize articles and save them for later reference.

## Features

- Google OAuth authentication
- Article summarization using NLP techniques
- Save and manage summaries
- Dashboard with summary statistics
- Responsive design

## Tech Stack

### Frontend
- React
- TypeScript
- React Router
- Google OAuth

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- NLTK for NLP processing

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- PostgreSQL

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/readwise.git
cd readwise
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

4. Set up the database
```bash
# Create a PostgreSQL database
createdb summarizer

# Initialize the database
python -m app.init_db
```

5. Start the backend server
```bash
cd backend
uvicorn app.main:app --reload
```

6. Start the frontend server
```bash
# In a new terminal window
cd frontend
npm start
```

7. Open your browser and navigate to http://localhost:3000

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/summarizer
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
