# Map App - Running Instructions

## Running with Docker

### Prerequisites
- Docker
- Docker Compose

### Steps
1. Clone the repository
2. Navigate to the project directory
3. Run the application:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Running Locally (Development)

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   python scripts/init_database.py
   ```

5. Start the backend server:
   ```bash
   python main.py
   ```
    or 
   ```bash
   uvicorn main:app
   ```

   Backend will be available at: http://localhost:8000

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will be available at: http://localhost:3000


NOTE :: make sure to create add your local .env variables
