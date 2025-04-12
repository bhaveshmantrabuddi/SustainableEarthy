from datetime import datetime
from typing import Dict, List, Optional, Any, Union

class MemStorage:
    """In-memory storage implementation to replicate the original JS storage"""
    
    def __init__(self):
        self.users = {}
        self.transactions = {}
        self.sustainability_scores = {}
        self.category_breakdowns = {}
        self.recommendations = {}
        
        self.current_user_id = 1
        self.current_transaction_id = 1
        self.current_score_id = 1
        self.current_breakdown_id = 1
        self.current_recommendation_id = 1
        
        # No default users or data - each new account starts empty
    
    # User methods
    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        for user in self.users.values():
            if user['username'] == username:
                return user
        return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        user_id = self.current_user_id
        self.current_user_id += 1
        
        user = {
            'id': user_id,
            'username': user_data['username'],
            'password': user_data['password'],
            'name': user_data.get('name')
        }
        
        self.users[user_id] = user
        return user
    
    # Transaction methods
    def get_transactions(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all transactions or filtered by user ID"""
        if user_id:
            return [tx for tx in self.transactions.values() if tx['userId'] == user_id]
        return list(self.transactions.values())
    
    def get_transaction_by_id(self, transaction_id: int) -> Optional[Dict[str, Any]]:
        """Get transaction by ID"""
        return self.transactions.get(transaction_id)
    
    def create_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new transaction"""
        transaction_id = self.current_transaction_id
        self.current_transaction_id += 1
        
        transaction = {
            'id': transaction_id,
            **transaction_data
        }
        
        self.transactions[transaction_id] = transaction
        return transaction
    
    def create_transactions(self, transactions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple transactions"""
        return [self.create_transaction(tx) for tx in transactions_data]
    
    def get_transactions_by_category(self, category: str, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get transactions filtered by category and optionally by user ID"""
        transactions = [tx for tx in self.transactions.values() if tx['category'] == category]
        
        if user_id:
            transactions = [tx for tx in transactions if tx['userId'] == user_id]
        
        return transactions
    
    def get_transactions_by_eco_score(self, min_score: int, max_score: int, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get transactions filtered by eco score range and optionally by user ID"""
        transactions = [
            tx for tx in self.transactions.values() 
            if tx['ecoScore'] >= min_score and tx['ecoScore'] <= max_score
        ]
        
        if user_id:
            transactions = [tx for tx in transactions if tx['userId'] == user_id]
        
        return transactions
    
    # Sustainability score methods
    def get_sustainability_scores(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all sustainability scores or filtered by user ID"""
        if user_id:
            return [score for score in self.sustainability_scores.values() if score['userId'] == user_id]
        return list(self.sustainability_scores.values())
    
    def get_latest_sustainability_score(self, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Get the latest sustainability score for a user"""
        scores = self.get_sustainability_scores(user_id)
        if not scores:
            return None
        
        # Find the most recent score based on date
        return max(scores, key=lambda score: score['date'])
    
    def create_sustainability_score(self, score_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new sustainability score"""
        score_id = self.current_score_id
        self.current_score_id += 1
        
        score = {
            'id': score_id,
            **score_data
        }
        
        self.sustainability_scores[score_id] = score
        return score
    
    # Category breakdown methods
    def get_category_breakdowns(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all category breakdowns or filtered by user ID"""
        if user_id:
            return [bd for bd in self.category_breakdowns.values() if bd['userId'] == user_id]
        return list(self.category_breakdowns.values())
    
    def create_category_breakdown(self, breakdown_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new category breakdown"""
        breakdown_id = self.current_breakdown_id
        self.current_breakdown_id += 1
        
        breakdown = {
            'id': breakdown_id,
            **breakdown_data
        }
        
        self.category_breakdowns[breakdown_id] = breakdown
        return breakdown
    
    def create_category_breakdowns(self, breakdowns_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple category breakdowns"""
        return [self.create_category_breakdown(bd) for bd in breakdowns_data]
    
    # Recommendation methods
    def get_recommendations(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all recommendations or filtered by user ID"""
        if user_id:
            return [rec for rec in self.recommendations.values() if rec['userId'] == user_id]
        return list(self.recommendations.values())
    
    def create_recommendation(self, recommendation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new recommendation"""
        recommendation_id = self.current_recommendation_id
        self.current_recommendation_id += 1
        
        recommendation = {
            'id': recommendation_id,
            **recommendation_data
        }
        
        self.recommendations[recommendation_id] = recommendation
        return recommendation

# Create the singleton instance
storage = MemStorage()