from flask import Flask, session, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_session import Session
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import pandas as pd

# Import our modules
from auth import setup_auth
from storage import storage
from utils.csv_parser import CSVParseError, parse_csv
from utils.sustainability_calculator import process_transactions

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../client/dist')
app.secret_key = os.environ.get('SESSION_SECRET') or 'dev-secret-key'

# Configure session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './flask_session'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_USE_SIGNER'] = True

# Initialize Flask extensions
CORS(app, supports_credentials=True)
Session(app)

# Setup authentication
setup_auth(app)

# Helper function for authentication middleware
def is_authenticated():
    def decorator(route_function):
        def wrapper(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({"message": "Authentication required"}), 401
            return route_function(*args, **kwargs)
        wrapper.__name__ = route_function.__name__
        return wrapper
    return decorator

# API Routes
@app.route('/api/sustainability-score', methods=['GET'])
@is_authenticated()
def get_sustainability_score():
    user_id = session['user_id']
    score = storage.get_latest_sustainability_score(user_id)
    if not score:
        return jsonify({"message": "No sustainability score found"}), 404
    return jsonify(score)

@app.route('/api/transactions', methods=['GET'])
@is_authenticated()
def get_transactions():
    user_id = session['user_id']
    category = request.args.get('category')
    min_score = request.args.get('minScore')
    max_score = request.args.get('maxScore')
    
    if category:
        transactions = storage.get_transactions_by_category(category, user_id)
    elif min_score and max_score:
        transactions = storage.get_transactions_by_eco_score(int(min_score), int(max_score), user_id)
    else:
        transactions = storage.get_transactions(user_id)
    
    return jsonify(transactions)

@app.route('/api/category-breakdowns', methods=['GET'])
@is_authenticated()
def get_category_breakdowns():
    user_id = session['user_id']
    breakdowns = storage.get_category_breakdowns(user_id)
    return jsonify(breakdowns)

@app.route('/api/recommendations', methods=['GET'])
@is_authenticated()
def get_recommendations():
    user_id = session['user_id']
    recommendations = storage.get_recommendations(user_id)
    return jsonify(recommendations)

@app.route('/api/upload-csv', methods=['POST'])
@is_authenticated()
def upload_csv():
    if not request.json or 'csvData' not in request.json:
        return jsonify({"message": "No CSV data provided"}), 400
    
    csv_data = request.json['csvData']
    user_id = session['user_id']
    
    try:
        # Parse CSV data
        csv_rows = parse_csv(csv_data)
        
        # Process CSV into transactions and calculate sustainability metrics
        result = process_transactions(csv_rows, user_id)
        
        # Store transactions
        saved_transactions = storage.create_transactions(result['transactions'])
        
        # Store sustainability score
        saved_score = storage.create_sustainability_score(result['sustainability_score'])
        
        # Store category breakdowns
        saved_breakdowns = storage.create_category_breakdowns(result['category_breakdowns'])
        
        return jsonify({
            "message": "CSV data processed successfully",
            "transactionsCount": len(saved_transactions),
            "sustainabilityScore": saved_score
        })
        
    except CSVParseError as e:
        return jsonify({
            "message": f"CSV parsing error: {str(e)}",
            "lineNumber": getattr(e, 'line_number', None)
        }), 400
    except Exception as e:
        app.logger.error(f"Error processing CSV: {str(e)}")
        return jsonify({"message": f"Failed to process CSV data: {str(e)}"}), 500

# Serve frontend static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Create session directory if it doesn't exist
    if not os.path.exists('./flask_session'):
        os.makedirs('./flask_session')
    
    # Run the app
    app.run(host='0.0.0.0', port=5000, debug=True)