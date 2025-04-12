from datetime import datetime
from typing import Dict, List, Optional, Any
import threading

class MemStorage:
    """In-memory storage implementation to replicate the original JS storage"""
    
    def __init__(self):
        """Initialize empty storage collections"""
        self.users = {}  # Map of user ID to user object
        self.transactions = {}  # Map of transaction ID to transaction object
        self.sustainability_scores = {}  # Map of score ID to score object
        self.category_breakdowns = {}  # Map of breakdown ID to breakdown object
        self.recommendations = {}  # Map of recommendation ID to recommendation object
        
        # Counters for generating IDs
        self.current_user_id = 0
        self.current_transaction_id = 0
        self.current_score_id = 0
        self.current_breakdown_id = 0
        self.current_recommendation_id = 0
        
        # Lock for thread safety
        self.lock = threading.Lock()
    
    def get_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        for user in self.users.values():
            if user["username"].lower() == username.lower():
                return user
        return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        with self.lock:
            self.current_user_id += 1
            user_id = self.current_user_id
            
            user = {
                "id": user_id,
                "username": user_data["username"],
                "password": user_data["password"],
                "name": user_data.get("name", "")
            }
            
            self.users[user_id] = user
            return user
    
    def get_transactions(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all transactions or filtered by user ID"""
        if user_id is None:
            return list(self.transactions.values())
        
        return [t for t in self.transactions.values() if t["userId"] == user_id]
    
    def get_transaction_by_id(self, transaction_id: int) -> Optional[Dict[str, Any]]:
        """Get transaction by ID"""
        return self.transactions.get(transaction_id)
    
    def create_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new transaction"""
        with self.lock:
            self.current_transaction_id += 1
            transaction_id = self.current_transaction_id
            
            transaction = {
                "id": transaction_id,
                **transaction_data
            }
            
            self.transactions[transaction_id] = transaction
            return transaction
    
    def create_transactions(self, transactions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple transactions"""
        return [self.create_transaction(t) for t in transactions_data]
    
    def get_transactions_by_category(self, category: str, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get transactions filtered by category and optionally by user ID"""
        transactions = self.get_transactions(user_id)
        return [t for t in transactions if t["category"].lower() == category.lower()]
    
    def get_transactions_by_eco_score(self, min_score: int, max_score: int, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get transactions filtered by eco score range and optionally by user ID"""
        transactions = self.get_transactions(user_id)
        return [t for t in transactions if min_score <= t["ecoScore"] <= max_score]
    
    def get_sustainability_scores(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all sustainability scores or filtered by user ID"""
        if user_id is None:
            return list(self.sustainability_scores.values())
        
        return [s for s in self.sustainability_scores.values() if s["userId"] == user_id]
    
    def get_latest_sustainability_score(self, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Get the latest sustainability score for a user"""
        scores = self.get_sustainability_scores(user_id)
        if not scores:
            return None
        
        # Find the most recent score
        return max(scores, key=lambda s: s["date"])
    
    def create_sustainability_score(self, score_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new sustainability score"""
        with self.lock:
            self.current_score_id += 1
            score_id = self.current_score_id
            
            score = {
                "id": score_id,
                **score_data
            }
            
            self.sustainability_scores[score_id] = score
            return score
    
    def get_category_breakdowns(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all category breakdowns or filtered by user ID"""
        if user_id is None:
            return list(self.category_breakdowns.values())
        
        return [b for b in self.category_breakdowns.values() if b["userId"] == user_id]
    
    def create_category_breakdown(self, breakdown_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new category breakdown"""
        with self.lock:
            self.current_breakdown_id += 1
            breakdown_id = self.current_breakdown_id
            
            breakdown = {
                "id": breakdown_id,
                **breakdown_data
            }
            
            self.category_breakdowns[breakdown_id] = breakdown
            return breakdown
    
    def create_category_breakdowns(self, breakdowns_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create multiple category breakdowns"""
        return [self.create_category_breakdown(b) for b in breakdowns_data]
    
    def get_recommendations(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all recommendations or filtered by user ID"""
        if user_id is None:
            return list(self.recommendations.values())
        
        return [r for r in self.recommendations.values() if r["userId"] == user_id]
    
    def create_recommendation(self, recommendation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new recommendation"""
        with self.lock:
            self.current_recommendation_id += 1
            recommendation_id = self.current_recommendation_id
            
            recommendation = {
                "id": recommendation_id,
                **recommendation_data
            }
            
            self.recommendations[recommendation_id] = recommendation
            return recommendation


# Create a singleton instance
storage = MemStorage()