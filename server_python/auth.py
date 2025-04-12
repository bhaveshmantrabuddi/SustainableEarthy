from flask import Flask, request, session, jsonify
from passlib.hash import pbkdf2_sha256
from storage import storage

def hash_password(password):
    """Hash a password using PBKDF2 with SHA-256"""
    return pbkdf2_sha256.hash(password)

def verify_password(password, hashed):
    """Verify a password against a hash"""
    return pbkdf2_sha256.verify(password, hashed)

def setup_auth(app):
    """Setup authentication routes and middleware"""
    
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.json
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Username and password are required"}), 400
        
        # Check if username already exists
        existing_user = storage.get_user_by_username(data['username'])
        if existing_user:
            return jsonify({"error": "Username already exists"}), 400
        
        # Create new user
        user_data = {
            'username': data['username'],
            'password': hash_password(data['password']),
            'name': data.get('name')  # Name is optional
        }
        
        user = storage.create_user(user_data)
        
        # Set user in session
        session['user_id'] = user['id']
        
        # Don't send password back to client
        user_info = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify(user_info), 201
    
    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.json
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Username and password are required"}), 400
        
        # Find user by username
        user = storage.get_user_by_username(data['username'])
        
        # Check if user exists and password is correct
        if not user or not verify_password(data['password'], user['password']):
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Set user in session
        session['user_id'] = user['id']
        
        # Don't send password back to client
        user_info = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify(user_info), 200
    
    @app.route('/api/logout', methods=['POST'])
    def logout():
        # Clear the session
        session.clear()
        return jsonify({"message": "Logged out successfully"}), 200
    
    @app.route('/api/user', methods=['GET'])
    def get_user():
        if 'user_id' not in session:
            return jsonify({"error": "Not authenticated"}), 401
        
        user = storage.get_user(session['user_id'])
        if not user:
            session.clear()
            return jsonify({"error": "User not found"}), 404
        
        # Don't send password back to client
        user_info = {k: v for k, v in user.items() if k != 'password'}
        
        return jsonify(user_info), 200