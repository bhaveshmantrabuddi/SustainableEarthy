# EcoFinance - Sustainable Finance Tracker

A web application that helps users track and improve their environmental impact through financial behavior analysis, providing actionable sustainability insights.

## Features

- **Authentication System**: Secure user registration and login
- **Transaction Analysis**: Upload and analyze credit card transactions
- **Sustainability Scoring**: Calculate eco-scores for purchases
- **Category Breakdowns**: Visualize spending patterns by category
- **Recommendations**: Get personalized suggestions for sustainable alternatives
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## Technology Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- Recharts for data visualization
- Shadcn UI components
- Tailwind CSS for styling

### Backend Options
1. **Node.js/Express Backend** (Original)
   - Express.js server
   - Passport.js for authentication
   - Session management with MemoryStore
   - In-memory data storage

2. **Python/Flask Backend** (New Alternative)
   - Flask server
   - Flask-Session for session management
   - Passlib for password hashing
   - In-memory data storage

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main application component
│
├── server/               # Node.js backend
│   ├── utils/            # Utility functions
│   ├── auth.ts           # Authentication logic
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data storage
│   └── index.ts          # Server entry point
│
├── server_python/        # Python Flask backend
│   ├── utils/            # Utility functions
│   ├── auth.py           # Authentication logic
│   ├── app.py            # API endpoints and server
│   ├── storage.py        # Data storage
│   └── run.py            # Server entry point
│
└── shared/               # Shared code between frontend and backend
    └── schema.ts         # Data models and validation
```

## Getting Started

### Running the Node.js Backend (Default)
```
npm run dev
```

### Running the Python Backend (Alternative)
```
cd server_python
python run.py
```

The frontend will automatically be served by the active backend.

## Usage

1. Register a new account or log in
2. Upload a CSV file of your credit card transactions
   - Required columns: date, merchant, category, amount
3. View your sustainability score and spending analysis on the Dashboard
4. Explore detailed transaction history in the Transactions section
5. Get insights about your environmental impact in the Insights section
6. Find personalized recommendations to improve your sustainability