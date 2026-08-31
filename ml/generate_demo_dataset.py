"""
DEMO dataset generator for the EcoFinance transaction classifier.

IMPORTANT HONESTY NOTE
======================
This repository contains NO original training data for the resume claim
"88% accuracy / 20%+ overfitting". This script generates a SYNTHETIC,
deterministic dataset so the full LightGBM training/evaluation pipeline is
reproducible and testable. Any accuracy numbers produced from this dataset are
DEMO numbers on synthetic data — they must NOT be quoted as the resume claim's
real-world result. Replace this generator with real labeled data to make the
claim reproducible.

What it generates (ml/data/demo_transactions.csv):
- 6,000 rows, 11 transaction categories
- category-specific merchant vocabularies with realistic typos/ambiguity
- category-specific amount distributions
- fixed RNG seed (42) for full reproducibility
"""
import csv
import random
from pathlib import Path

SEED = 42
N_ROWS = 6000
OUT_PATH = Path(__file__).parent / "data" / "demo_transactions.csv"

CATEGORIES = [
    "groceries", "shopping", "transportation", "dining", "utilities",
    "entertainment", "housing", "health", "education", "travel", "other",
]

# Category priors (realistic spending mix)
CATEGORY_WEIGHTS = {
    "groceries": 0.18, "shopping": 0.16, "transportation": 0.10, "dining": 0.14,
    "utilities": 0.06, "entertainment": 0.07, "housing": 0.05, "health": 0.05,
    "education": 0.04, "travel": 0.04, "other": 0.11,
}

# Merchant vocabularies per category (with cross-category ambiguity on purpose)
MERCHANTS = {
    "groceries": ["whole foods market", "trader joes", "safeway inc", "kroger", "walmart grocery", "sprouts fm", "aldi store", "costco whse"],
    "shopping": ["amazon marketplace", "target store", "h&m", "zara", "walmart supercenter", "best buy", "nike store", "sephora"],
    "transportation": ["uber trip", "lyft ride", "shell oil", "chevron fuel", "metro transit", "parking authority", "citi bike"],
    "dining": ["starbucks", "mcdonalds", "chipotle", "sweetgreen", "local coffee", "dominos pizza", "olive garden"],
    "utilities": ["pg&e electric", "comcast xfinity", "verizon wireless", "water dept", "at&t fiber"],
    "entertainment": ["netflix.com", "spotify usa", "amc theatres", "steam games", "spotify", "eventbrite"],
    "housing": ["rent payment llc", "zillow rentals", "home depot", "lowes home", "apt complex mgmt"],
    "health": ["cvs pharmacy", "walgreens", "24hr fitness", "planet fitness", "dentist office"],
    "education": ["udemy course", "coursera inc", "kindle books", "bookshop org", "skillshare"],
    "travel": ["delta air", "united airlines", "airbnb inc", "booking.com", "marriott hotel", "expedia"],
    "other": ["venmo payment", "paypal transfer", "atm withdrawal", "irs usataxpymt", "usps postage"],
}

# Amount ranges (log-uniform-ish) per category
AMOUNT_RANGE = {
    "groceries": (12, 180), "shopping": (15, 320), "transportation": (3, 90),
    "dining": (6, 85), "utilities": (25, 220), "entertainment": (5, 60),
    "housing": (600, 2600), "health": (10, 240), "education": (12, 400),
    "travel": (80, 1400), "other": (5, 150),
}

# Characters commonly mistyped, used to add realistic OCR/typo noise
TYPOS = {"a": "s", "e": "r", "i": "o", "o": "i", "n": "m", "s": "a", "r": "t", "t": "y"}


def add_noise(merchant: str, rng: random.Random) -> str:
    """Make merchants realistically messy: typos, case jitter, suffix noise."""
    text = merchant
    if rng.random() < 0.35:  # typo injection
        idx = rng.randrange(len(text))
        ch = text[idx].lower()
        if ch in TYPOS:
            text = text[:idx] + TYPOS[ch] + text[idx + 1:]
    if rng.random() < 0.30:  # case jitter
        text = text.upper() if rng.random() < 0.5 else text.title()
    if rng.random() < 0.20:  # trailing store numbers / descriptors
        text = f"{text} #{rng.randint(1, 999)}"
    return text


def main() -> None:
    rng = random.Random(SEED)
    categories = list(CATEGORY_WEIGHTS.keys())
    weights = [CATEGORY_WEIGHTS[c] for c in categories]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["merchant", "amount", "category"])
        for _ in range(N_ROWS):
            category = rng.choices(categories, weights=weights, k=1)[0]
            merchant = add_noise(rng.choice(MERCHANTS[category]), rng)
            low, high = AMOUNT_RANGE[category]
            amount = round(rng.uniform(low, high), 2)
            writer.writerow([merchant, amount, category])

    print(f"Wrote {N_ROWS} SYNTHETIC rows to {OUT_PATH}")
    print("These are demo data — do NOT use the resulting metrics as real-world claims.")


if __name__ == "__main__":
    main()
