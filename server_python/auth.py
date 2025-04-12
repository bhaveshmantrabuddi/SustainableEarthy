from flask import Blueprint, request, session, jsonify
from functools import wraps
from werkzeug.exceptions import Unauthorized
from passlib.hash import pbkdf2_sha256
import os
import secrets
from storage import storage

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Hash a password using PBKDF2 with SHA-256"""
    return pbkdf2_sha256.hash(password)

def verify_password(password, hashed):
    """Verify a password against a hash"""
    return pbkdf2_sha256.verify(password, hashed)

def login_required(f):
    """Decorator to require login for a route"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            raise Unauthorized("You must be logged in to access this resource")
        return f(*args, **kwargs)
    return decorated_function

def setup_auth(app):
    """Setup authentication routes and middleware"""
    # Set up the session
    app.secret_key = os.environ.get('SESSION_SECRET', secrets.token_hex(16))
    
    @auth_bp.route('/api/register', methods=['POST'])
    def register():
        """Register a new user"""
        data = request.json
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        # Check if username already exists
        existing_user = storage.get_user_by_username(data['username'])
        if existing_user:
            return jsonify({"error": "Username already exists"}), 400
        
        # Create user with hashed password
        user_data = {
            "username": data['username'],
            "password": hash_password(data['password']),
            "name": data.get('name', '')
        }
        
        user = storage.create_user(user_data)
        
        # Store user ID in session
        session['user_id'] = user['id']
        
        # Don't return the password hash
        user_response = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify(user_response), 201
    
    @auth_bp.route('/api/login', methods=['POST'])
    def login():
        """Login a user"""
        data = request.json
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        # Find user by username
        user = storage.get_user_by_username(data['username'])
        
        # Check if user exists and password is correct
        if not user or not verify_password(data['password'], user['password']):
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Store user ID in session
        session['user_id'] = user['id']
        
        # Don't return the password hash
        user_response = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify(user_response), 200
    
    @auth_bp.route('/api/logout', methods=['POST'])
    def logout():
        """Logout the current user"""
        session.clear()
        return jsonify({"message": "Logged out successfully"}), 200
    
    @auth_bp.route('/api/user', methods=['GET'])
    @login_required
    def get_user():
        """Get the current user's information"""
        user_id = session.get('user_id')
        user = storage.get_user(user_id)
        
        if not user:
            session.clear()
            return jsonify({"error": "User not found"}), 401
        
        # Don't return the password hash
        user_response = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify(user_response), 200
    
    # Register the blueprint
    app.register_blueprint(auth_bp)
    
    # Error handler for Unauthorized exceptions
    @app.errorhandler(Unauthorized)
    def handle_unauthorized(e):
        return jsonify({"error": str(e)}), 401