from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from flask_session import Session
from functools import wraps
from dotenv import load_dotenv
import os
import pandas as pd
import json
from datetime import datetime
import traceback

from storage import storage
from auth import setup_auth, login_required
from utils.csv_parser import parse_csv, CSVParseError
from utils.sustainability_calculator import process_transactions

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="../client/dist")
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True

# Set up CORS
CORS(app, supports_credentials=True)

# Initialize session
Session(app)

# Set up authentication
setup_auth(app)

# Utility to generate recommendations based on transactions
def generate_recommendations(user_id):
    """Generate sustainability recommendations based on user transactions"""
    transactions = storage.get_transactions(user_id)
    
    if not transactions:
        return []
    
    recommendations = []
    
    # Check for high-impact categories
    categories = {}
    for t in transactions:
        category = t["category"].lower()
        if category not in categories:
            categories[category] = {"count": 0, "score": 0, "amount": 0}
        
        categories[category]["count"] += 1
        categories[category]["score"] += t["ecoScore"]
        categories[category]["amount"] += t["amount"]
    
    for category, data in categories.items():
        avg_score = data["score"] / data["count"]
        
        if avg_score < 50 and data["count"] >= 2:
            recommendations.append({
                "userId": user_id,
                "title": f"Improve {category.title()} Choices",
                "description": f"Your {category} spending has a low eco score of {avg_score:.0f}. Consider more sustainable alternatives.",
                "impact": "medium" if avg_score < 30 else "low"
            })
    
    # Check for specific merchants with alternatives
    alternatives_count = sum(1 for t in transactions if t["hasAlternatives"])
    if alternatives_count > 0:
        recommendations.append({
            "userId": user_id,
            "title": "Sustainable Alternatives Available",
            "description": f"We found {alternatives_count} transactions where more sustainable alternatives are available.",
            "impact": "high" if alternatives_count > 5 else "medium"
        })
    
    # Add general recommendation if needed
    if not recommendations:
        recommendations.append({
            "userId": user_id,
            "title": "Track More Transactions",
            "description": "Upload more transactions to get personalized sustainability recommendations.",
            "impact": "low"
        })
    
    # Store recommendations in storage
    stored_recommendations = []
    for rec in recommendations:
        stored_recommendations.append(storage.create_recommendation(rec))
    
    return stored_recommendations

@app.route("/api/upload-csv", methods=["POST"])
@login_required
def upload_csv():
    """Upload and process CSV file with transactions"""
    user_id = request.cookies.get("user_id") or session.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    if not request.json or "csvContent" not in request.json:
        return jsonify({"error": "CSV content is required"}), 400
    
    csv_content = request.json["csvContent"]
    
    try:
        # Parse CSV content
        csv_rows = parse_csv(csv_content)
        
        # Process transactions
        result = process_transactions(csv_rows, user_id)
        
        # Store processed data
        transactions = storage.create_transactions(result["transactions"])
        sustainability_score = storage.create_sustainability_score(result["sustainability_score"])
        category_breakdowns = storage.create_category_breakdowns(result["category_breakdowns"])
        
        # Generate recommendations
        recommendations = generate_recommendations(user_id)
        
        return jsonify({
            "message": "CSV uploaded and processed successfully",
            "transactions_count": len(transactions)
        }), 200
        
    except CSVParseError as e:
        return jsonify({
            "error": f"CSV parsing error: {str(e)}",
            "line_number": e.line_number
        }), 400
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": f"Error processing CSV: {str(e)}"}), 500

@app.route("/api/sustainability-score", methods=["GET"])
@login_required
def get_sustainability_score():
    """Get the user's latest sustainability score"""
    user_id = request.cookies.get("user_id") or session.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    score = storage.get_latest_sustainability_score(user_id)
    
    if not score:
        return jsonify(None), 200
    
    return jsonify(score), 200

@app.route("/api/transactions", methods=["GET"])
@login_required
def get_transactions():
    """Get user transactions"""
    user_id = request.cookies.get("user_id") or session.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    transactions = storage.get_transactions(user_id)
    
    return jsonify(transactions), 200

@app.route("/api/category-breakdowns", methods=["GET"])
@login_required
def get_category_breakdowns():
    """Get user's spending category breakdowns"""
    user_id = request.cookies.get("user_id") or session.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    breakdowns = storage.get_category_breakdowns(user_id)
    
    return jsonify(breakdowns), 200

@app.route("/api/recommendations", methods=["GET"])
@login_required
def get_recommendations():
    """Get sustainability recommendations for the user"""
    user_id = request.cookies.get("user_id") or session.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User not authenticated"}), 401
    
    recommendations = storage.get_recommendations(user_id)
    
    # Generate new recommendations if none exist
    if not recommendations:
        recommendations = generate_recommendations(user_id)
    
    return jsonify(recommendations), 200

# Serve frontend static files
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    """Serve static files from the frontend build"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

# Error handler
@app.errorhandler(Exception)
def handle_error(e):
    """Global error handler"""
    print(traceback.format_exc())
    return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)