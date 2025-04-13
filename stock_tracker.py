import yfinance as yf
import pandas as pd
from datetime import datetime
import json
import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
tracker = None

class StockTracker:
    def __init__(self):
        self.portfolio_file = 'portfolio.json'
        self.portfolio = self.load_portfolio()

    def load_portfolio(self):
        if os.path.exists(self.portfolio_file):
            with open(self.portfolio_file, 'r') as f:
                return json.load(f)
        return {}

    def save_portfolio(self):
        with open(self.portfolio_file, 'w') as f:
            json.dump(self.portfolio, f, indent=4)

    def get_stock_info(self, symbol):
        try:
            stock = yf.Ticker(symbol)
            info = stock.info
            current_price = info.get('currentPrice', 0)
            return {
                'name': info.get('longName', symbol),
                'current_price': current_price,
                'currency': info.get('currency', 'USD')
            }
        except Exception as e:
            print(f"Error fetching stock info: {e}")
            return None

    def buy_stock(self, symbol, shares):
        stock_info = self.get_stock_info(symbol)
        if not stock_info:
            return False

        if symbol not in self.portfolio:
            self.portfolio[symbol] = {
                'shares': 0,
                'purchases': []
            }

        purchase = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'shares': shares,
            'price': stock_info['current_price']
        }

        self.portfolio[symbol]['purchases'].append(purchase)
        self.portfolio[symbol]['shares'] += shares
        self.save_portfolio()
        return True

    def calculate_roi(self, symbol):
        if symbol not in self.portfolio:
            return None

        stock_info = self.get_stock_info(symbol)
        if not stock_info:
            return None

        current_price = stock_info['current_price']
        total_investment = 0
        total_shares = 0

        for purchase in self.portfolio[symbol]['purchases']:
            total_investment += purchase['shares'] * purchase['price']
            total_shares += purchase['shares']

        current_value = total_shares * current_price
        roi = ((current_value - total_investment) / total_investment) * 100

        return {
            'total_investment': total_investment,
            'current_value': current_value,
            'roi_percentage': roi,
            'total_shares': total_shares
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/buy_stock', methods=['POST'])
def buy_stock():
    data = request.json
    symbol = data.get('symbol')
    shares = data.get('shares')
    
    if not symbol or not shares:
        return jsonify({'success': False, 'error': 'Missing symbol or shares'})
    
    success = tracker.buy_stock(symbol, shares)
    return jsonify({'success': success})

@app.route('/portfolio')
def get_portfolio():
    return jsonify(tracker.portfolio)

@app.route('/roi/<symbol>')
def get_roi(symbol):
    roi_info = tracker.calculate_roi(symbol)
    return jsonify(roi_info)

if __name__ == '__main__':
    tracker = StockTracker()
    app.run(host='127.0.0.1', port=5000)