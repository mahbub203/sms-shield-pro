import os
import json
import joblib
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from app.ml.dataset import get_augmented_dataset

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.joblib")
LR_MODEL_PATH = os.path.join(MODEL_DIR, "lr_model.joblib")
NB_MODEL_PATH = os.path.join(MODEL_DIR, "nb_model.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

def train_and_evaluate():
    """Trains ML models on SMS corpus and saves artifacts and genuine held-out metrics."""
    data = get_augmented_dataset()
    texts = [item[0] for item in data]
    labels = [item[1] for item in data]

    # 75/25 Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=4000,
        sublinear_tf=True,
        lowercase=True,
        stop_words="english"
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # 1. Primary Model: Logistic Regression
    lr = LogisticRegression(C=1.5, max_iter=1000, random_state=42)
    lr.fit(X_train_vec, y_train)
    lr_preds = lr.predict(X_test_vec)

    # 2. Benchmark Model: Multinomial Naive Bayes
    nb = MultinomialNB(alpha=0.1)
    nb.fit(X_train_vec, y_train)
    nb_preds = nb.predict(X_test_vec)

    # Calculate real evaluation metrics on held-out test split
    acc = float(accuracy_score(y_test, lr_preds))
    prec = float(precision_score(y_test, lr_preds, zero_division=0))
    rec = float(recall_score(y_test, lr_preds, zero_division=0))
    f1 = float(f1_score(y_test, lr_preds, zero_division=0))
    cm = confusion_matrix(y_test, lr_preds).tolist()

    nb_acc = float(accuracy_score(y_test, nb_preds))
    nb_f1 = float(f1_score(y_test, nb_preds, zero_division=0))

    metrics = {
        "model_name": "LogisticRegression (Primary) + MultinomialNB (Ensemble)",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "nb_accuracy": round(nb_acc, 4),
        "nb_f1_score": round(nb_f1, 4),
        "dataset_size": len(data),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "training_timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Save artifacts
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(lr, LR_MODEL_PATH)
    joblib.dump(nb, NB_MODEL_PATH)

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"[ML] Training completed. Samples: {len(data)}, Accuracy: {acc*100:.2f}%, F1: {f1:.4f}")
    return metrics

if __name__ == "__main__":
    train_and_evaluate()
