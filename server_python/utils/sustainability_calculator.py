from datetime import datetime
from typing import List, Dict, Any, Tuple

def calculate_eco_score(merchant: str, category: str) -> int:
    """
    Calculate an eco score for a transaction based on merchant and category
    
    Args:
        merchant: The merchant name
        category: The transaction category
        
    Returns:
        An eco score from 0-100
    """
    # Define base eco scores for different categories
    category_scores = {
        'food & drink': 70,
        'groceries': 75,
        'restaurants': 60,
        'transportation': 50,
        'travel': 30,
        'shopping': 40,
        'entertainment': 65,
        'utilities': 55,
        'health': 80,
        'education': 90
    }
    
    # Calculate base score from category
    base_score = 50  # Default
    category_lower = category.lower()
    
    for cat, score in category_scores.items():
        if cat in category_lower:
            base_score = score
            break
    
    # Adjust score based on merchant
    merchant_lower = merchant.lower()
    
    # Sustainable merchants boost score
    sustainable_merchants = ['farmers market', 'local', 'organic', 'co-op', 'bike', 'thrift', 'second hand']
    for term in sustainable_merchants:
        if term in merchant_lower:
            base_score += 15
            break
    
    # Less sustainable merchants reduce score
    less_sustainable = ['fast food', 'air', 'flight', 'gas', 'uber', 'lyft', 'disposable']
    for term in less_sustainable:
        if term in merchant_lower:
            base_score -= 20
            break
    
    # Ensure score is within bounds
    return max(0, min(100, base_score))

def has_alternatives(merchant: str, category: str, eco_score: int) -> bool:
    """
    Determine if a transaction has more sustainable alternatives
    
    Args:
        merchant: The merchant name
        category: The transaction category
        eco_score: The calculated eco score
        
    Returns:
        Boolean indicating if alternatives exist
    """
    # If eco score is already high, likely no better alternatives
    if eco_score >= 80:
        return False
    
    # Categories with known alternatives
    categories_with_alternatives = [
        'transportation', 'travel', 'shopping', 'food & drink', 
        'groceries', 'restaurants'
    ]
    
    category_lower = category.lower()
    merchant_lower = merchant.lower()
    
    for cat in categories_with_alternatives:
        if cat in category_lower:
            # Special cases for different merchants
            if 'uber' in merchant_lower or 'lyft' in merchant_lower or 'taxi' in merchant_lower:
                return True  # Public transit alternatives
            
            if 'amazon' in merchant_lower or 'walmart' in merchant_lower:
                return True  # Local shopping alternatives
            
            if 'fast food' in merchant_lower or 'mcdonald' in merchant_lower:
                return True  # Healthier food alternatives
            
            # General rule based on eco score
            if eco_score < 60:
                return True
    
    return False

def process_transactions(csv_rows: List[Dict[str, Any]], user_id: int) -> Dict[str, Any]:
    """
    Process CSV rows into transactions with sustainability metrics
    
    Args:
        csv_rows: List of dictionaries containing transaction data
        user_id: User ID to associate with the transactions
        
    Returns:
        Dictionary containing transactions, sustainability score, and category breakdowns
    """
    transactions = []
    category_totals = {}
    category_scores = {}
    total_amount = 0
    total_eco_score = 0
    sustainable_purchases = 0
    
    # Process each transaction
    for row in csv_rows:
        # Parse date and amount
        try:
            date = datetime.strptime(row['date'], '%Y-%m-%d')
        except ValueError:
            try:
                date = datetime.strptime(row['date'], '%m/%d/%Y')
            except ValueError:
                date = datetime.now()  # Fallback to current date
        
        try:
            amount = float(row['amount'].replace('$', '').replace(',', ''))
        except ValueError:
            amount = 0
        
        # Calculate eco score
        eco_score = calculate_eco_score(row['merchant'], row['category'])
        
        # Check if alternatives exist
        has_alts = has_alternatives(row['merchant'], row['category'], eco_score)
        
        # Create transaction object
        transaction = {
            'userId': user_id,
            'date': date,
            'merchant': row['merchant'],
            'category': row['category'],
            'amount': amount,
            'ecoScore': eco_score,
            'hasAlternatives': has_alts
        }
        
        transactions.append(transaction)
        
        # Update metrics
        total_amount += amount
        total_eco_score += eco_score
        
        if eco_score >= 70:
            sustainable_purchases += 1
        
        # Update category totals
        category = row['category'].lower()
        if category not in category_totals:
            category_totals[category] = 0
            category_scores[category] = []
        
        category_totals[category] += amount
        category_scores[category].append(eco_score)
    
    # Calculate overall metrics
    transaction_count = len(transactions)
    avg_eco_score = round(total_eco_score / transaction_count) if transaction_count > 0 else 0
    sustainable_percentage = round((sustainable_purchases / transaction_count) * 100) if transaction_count > 0 else 0
    
    # Create sustainability score
    sustainability_score = {
        'userId': user_id,
        'overallScore': avg_eco_score,
        'carbonFootprint': round(total_amount * (100 - avg_eco_score) / 100, 2),
        'sustainablePurchases': sustainable_percentage,
        'waterUsage': round(total_amount * 0.01 * (100 - avg_eco_score) / 100, 2),
        'date': datetime.now()
    }
    
    # Create category breakdowns
    category_breakdowns = []
    for category, total in category_totals.items():
        avg_category_score = round(sum(category_scores[category]) / len(category_scores[category]))
        category_breakdowns.append({
            'userId': user_id,
            'category': category,
            'amount': total,
            'ecoScore': avg_category_score
        })
    
    return {
        'transactions': transactions,
        'sustainability_score': sustainability_score,
        'category_breakdowns': category_breakdowns
    }