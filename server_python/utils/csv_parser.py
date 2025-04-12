import csv
import io
from typing import List, Dict, Any

class CSVParseError(Exception):
    """Exception raised for errors during CSV parsing"""
    def __init__(self, message: str, line_number: int = None):
        self.message = message
        self.line_number = line_number
        super().__init__(self.message)

def parse_csv(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parse CSV content into a list of dictionaries
    
    Args:
        csv_content: String containing CSV data
        
    Returns:
        List of dictionaries representing each row in the CSV
        
    Raises:
        CSVParseError: If there's an error parsing the CSV
    """
    try:
        # Create a file-like object from the string
        csv_file = io.StringIO(csv_content)
        
        # Parse CSV
        reader = csv.DictReader(csv_file)
        
        # Validate CSV has required headers
        required_fields = ['date', 'merchant', 'category', 'amount']
        headers = reader.fieldnames
        
        if not headers:
            raise CSVParseError("CSV has no headers")
        
        missing_fields = [field for field in required_fields if field not in headers]
        if missing_fields:
            raise CSVParseError(f"CSV is missing required fields: {', '.join(missing_fields)}")
        
        # Convert rows to list of dictionaries
        rows = []
        for i, row in enumerate(reader, 1):
            # Ensure all required fields have values
            empty_fields = [field for field in required_fields if not row[field]]
            if empty_fields:
                raise CSVParseError(f"Row is missing values for fields: {', '.join(empty_fields)}", i)
            
            # Add row to results
            rows.append({
                'date': row['date'],
                'merchant': row['merchant'],
                'category': row['category'],
                'amount': row['amount']
            })
        
        if not rows:
            raise CSVParseError("CSV is empty or has no valid rows")
        
        return rows
    
    except csv.Error as e:
        raise CSVParseError(f"CSV parsing error: {str(e)}")
    except Exception as e:
        if isinstance(e, CSVParseError):
            raise
        raise CSVParseError(f"Error parsing CSV: {str(e)}")