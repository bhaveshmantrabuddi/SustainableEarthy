"""
Reproducible LightGBM transaction-classifier training/evaluation.

IMPORTANT HONESTY NOTE
======================
Runs on the SYNTHETIC dataset from generate_demo_dataset.py (no real labeled
data exists in this repository). All metrics printed/saved here are DEMO
numbers on synthetic data. The resume claim "88% accuracy after fixing 20%+
overfitting" can only be verified by training on the ORIGINAL dataset.

Methodology (defensible, no test-set tuning):
  1. Stratified 60/20/20 train/validation/hold-out-test split (seed=42).
  2. "Untuned" configuration chosen to mirror a naive first pass
     (very large leaves, tiny leaf size, no regularization) -> measure the
     train-vs-validation gap (overfitting diagnosis).
  3. "Tuned" configuration uses standard LightGBM regularization knobs
     (num_leaves, max_depth, min_child_samples, feature_fraction, bagging,
     L1/L2, lower learning rate) + early stopping ON VALIDATION ONLY.
  4. Final accuracy is reported ONCE on the untouched hold-out test set.

Outputs: printed metrics + ml/results.json
"""
import json
import random
import numpy as np
from pathlib import Path

import lightgbm as lgb
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score

SEED = 42
DATA = Path(__file__).parent / "data" / "demo_transactions.csv"
RESULTS = Path(__file__).parent / "results.json"


def load_data():
    import csv

    merchants, amounts, labels = [], [], []
    with DATA.open() as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            merchants.append(row["merchant"])
            amounts.append(float(row["amount"]))
            labels.append(row["category"])
    return merchants, np.array(amounts), np.array(labels)


def build_features(merchants, amounts):
    """TF-IDF over merchant text + log-amount + merchant-length numeric features."""
    tfidf = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    X_text = tfidf.fit_transform(merchants)
    log_amount = np.log1p(amounts).reshape(-1, 1)
    length = np.array([len(m) for m in merchants], dtype=float).reshape(-1, 1)
    X_num = np.hstack([log_amount, length])
    return sparse.hstack([X_text, sparse.csr_matrix(X_num)]).tocsr()


def train_eval(X_tr, y_tr, X_va, y_va, X_te, y_te, params, num_boost_round, early_stopping=None):
    train_set = lgb.Dataset(X_tr, label=y_tr)
    val_set = lgb.Dataset(X_va, label=y_va, reference=train_set)
    booster = lgb.train(
        params,
        train_set,
        num_boost_round=num_boost_round,
        valid_sets=[val_set],
        callbacks=[lgb.early_stopping(early_stopping, verbose=False)] if early_stopping else [],
    )

    def acc(X, y):
        pred = booster.predict(X)
        return accuracy_score(y, pred.argmax(axis=1)), f1_score(y, pred.argmax(axis=1), average="macro")

    train_acc, train_f1 = acc(X_tr, y_tr)
    val_acc, val_f1 = acc(X_va, y_va)
    test_acc, test_f1 = acc(X_te, y_te)
    return {
        "train_accuracy": round(train_acc, 4),
        "validation_accuracy": round(val_acc, 4),
        "test_accuracy": round(test_acc, 4),
        "train_f1_macro": round(train_f1, 4),
        "validation_f1_macro": round(val_f1, 4),
        "test_f1_macro": round(test_f1, 4),
        "overfit_gap_train_minus_val": round(train_acc - val_acc, 4),
        "best_iteration": booster.best_iteration or num_boost_round,
    }

def main():
    random.seed(SEED)
    np.random.seed(SEED)

    merchants, amounts, labels = load_data()
    X = build_features(merchants, amounts)

    # Encode category strings -> integer labels (LightGBM requirement)
    encoder = LabelEncoder()
    y = encoder.fit_transform(labels)

    # 60/20/20 stratified split: train / validation / untouched hold-out test
    X_tr, X_tmp, y_tr, y_tmp = train_test_split(X, y, test_size=0.40, stratify=y, random_state=SEED)
    X_va, X_te, y_va, y_te = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=SEED)

    print(f"Dataset: {X.shape[0]} rows, {X.shape[1]} features (SYNTHETIC demo data)")
    print(f"Split: train={X_tr.shape[0]}, validation={X_va.shape[0]}, test={X_te.shape[0]}")

    num_class = len(set(labels))

    # ---- Stage 1: naive first-pass config (diagnose overfitting) -----------
    untuned_params = {
        "objective": "multiclass",
        "num_class": num_class,
        "metric": "multi_logloss",
        "learning_rate": 0.2,
        "num_leaves": 256,          # far too many leaves for this data size
        "max_depth": -1,            # unbounded depth
        "min_child_samples": 1,     # leaves can be single samples
        "feature_fraction": 1.0,    # no feature subsampling
        "bagging_fraction": 1.0,    # no row subsampling
        "lambda_l1": 0.0,
        "lambda_l2": 0.0,
        "verbosity": -1,
        "seed": SEED,
    }
    untuned = train_eval(X_tr, y_tr, X_va, y_va, X_te, y_te, untuned_params, num_boost_round=400)
    print("\n[1] UNTUNED (naive) LightGBM — overfitting diagnosis")
    print(f"    train acc={untuned['train_accuracy']:.4f}  val acc={untuned['validation_accuracy']:.4f}  "
          f"gap={untuned['overfit_gap_train_minus_val']:.4f}  test acc={untuned['test_accuracy']:.4f}")

    # ---- Stage 2: regularized/tuned config (validated, early stopping) -----
    tuned_params = {
        "objective": "multiclass",
        "num_class": num_class,
        "metric": "multi_logloss",
        "learning_rate": 0.05,
        "num_leaves": 31,
        "max_depth": 7,
        "min_child_samples": 40,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 1,
        "lambda_l1": 0.5,
        "lambda_l2": 5.0,
        "verbosity": -1,
        "seed": SEED,
    }
    tuned = train_eval(X_tr, y_tr, X_va, y_va, X_te, y_te, tuned_params,
                       num_boost_round=2000, early_stopping=50)
    print("\n[2] TUNED LightGBM (early stopping on validation only)")
    print(f"    train acc={tuned['train_accuracy']:.4f}  val acc={tuned['validation_accuracy']:.4f}  "
          f"gap={tuned['overfit_gap_train_minus_val']:.4f}")
    print(f"    HOLD-OUT TEST accuracy={tuned['test_accuracy']:.4f} (macro-F1 {tuned['test_f1_macro']:.4f})")

    results = {
        "data": "SYNTHETIC demo dataset (ml/generate_demo_dataset.py) — NOT real-world metrics",
        "seed": SEED,
        "rows": int(X.shape[0]),
        "classes": list(encoder.classes_),
        "split": {"train": int(X_tr.shape[0]), "validation": int(X_va.shape[0]), "test": int(X_te.shape[0])},
        "untuned": untuned,
        "tuned": tuned,
    }
    RESULTS.write_text(json.dumps(results, indent=2))
    print(f"\nSaved results to {RESULTS}")
    print("NOTE: numbers are from synthetic demo data and cannot substantiate the resume claim.")


if __name__ == "__main__":
    main()

