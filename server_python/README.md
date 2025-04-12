# EcoFinance Flask Backend

This is the Flask backend implementation for the EcoFinance application, which was converted from the original Node.js/Express backend.

## Setup

1. Make sure you have Python 3.9+ installed

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file to set your own secret key.

5. Run the application:
   ```
   python run.py
   ```

The server will start at http://localhost:5000

## API Endpoints

The backend provides the following API endpoints:

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Log in an existing user
- `POST /api/logout` - Log out the current user
- `GET /api/user` - Get the current user's information

### Transactions
- `GET /api/transactions` - Get the user's transactions
- `POST /api/upload-csv` - Upload and process CSV transaction data

### Sustainability Data
- `GET /api/sustainability-score` - Get the user's sustainability score
- `GET /api/category-breakdowns` - Get the user's spending category breakdowns
- `GET /api/recommendations` - Get sustainability recommendations for the user

## Frontend Integration

This backend is designed to work seamlessly with the existing React frontend. The API endpoints maintain the same signatures as the original Express backend, so no changes should be needed on the frontend.

The server also serves the frontend static files from the `../client/dist` directory after the frontend is built.

## Storage

The application uses in-memory storage for simplicity. In a production environment, you should replace this with a database like PostgreSQL or MongoDB.