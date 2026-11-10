import os
import json
import joblib
from typing import Dict, Any, Tuple, List

from app.ml.train_model import (
    VECTORIZER_PATH, LR_MODEL_PATH, NB_MODEL_PATH, METRICS_PATH, train_and_evaluate
)

class MLDetector:
    """Layer 3: Machine Learning Inference Engine"""

    def __init__(self):
        self.vectorizer = None
        self.lr_model = None
        self.nb_model = None
        self.metrics = None
        self._load_or_train()

    def _load_or_train(self):
        if not (os.path.exists(VECTORIZER_PATH) and os.path.exists(LR_MODEL_PATH) and os.path.exists(METRICS_PATH)):
            print("[ML] Artifacts not found. Training model now...")
            self.metrics = train_and_evaluate()

        try:
            self.vectorizer = joblib.load(VECTORIZER_PATH)
            self.lr_model = joblib.load(LR_MODEL_PATH)
            if os.path.exists(NB_MODEL_PATH):
                self.nb_model = joblib.load(NB_MODEL_PATH)
            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r", encoding="utf-8") as f:
                    self.metrics = json.load(f)
        except Exception as e:
            print(f"[ML] Error loading model artifacts: {e}. Retraining...")
            self.metrics = train_and_evaluate()
            self.vectorizer = joblib.load(VECTORIZER_PATH)
            self.lr_model = joblib.load(LR_MODEL_PATH)

    def get_metrics(self) -> Dict[str, Any]:
        if not self.metrics and os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, "r", encoding="utf-8") as f:
                self.metrics = json.load(f)
        return self.metrics or {}

    def predict(self, text: str) -> Tuple[float, float, List[str], str]:
        """
        Analyzes SMS text with trained TF-IDF + Logistic Regression ensemble.
        Returns:
            layer3_score (0-100),
            confidence (0.0-1.0),
            top_features (List[str]),
            model_name (str)
        """
        if not self.vectorizer or not self.lr_model:
            self._load_or_train()

        vec = self.vectorizer.transform([text])
        proba = self.lr_model.predict_proba(vec)[0]
        spam_prob = float(proba[1]) # probability of class 1 (spam/phishing)

        # Ensemble with Naive Bayes if present
        if self.nb_model:
            nb_proba = self.nb_model.predict_proba(vec)[0]
            # 70% LR weight, 30% NB weight
            spam_prob = 0.7 * spam_prob + 0.3 * float(nb_proba[1])

        layer3_score = round(spam_prob * 100.0, 2)
        confidence = round(max(spam_prob, 1.0 - spam_prob), 4)

        # Extract top indicative features
        top_features = []
        try:
            feature_names = self.vectorizer.get_feature_names_out()
            feature_indices = vec.indices
            coefs = self.lr_model.coef_[0]
            
            # Words with high positive coefficients in model
            contributions = []
            for idx in feature_indices:
                weight = coefs[idx] * vec[0, idx]
                if weight > 0.05:
                    contributions.append((feature_names[idx], weight))
            
            contributions.sort(key=lambda x: x[1], reverse=True)
            top_features = [word for word, _ in contributions[:5]]
        except Exception:
            pass

        model_name = "TF-IDF + Logistic Regression Ensemble"
        return layer3_score, confidence, top_features, model_name

ml_detector = MLDetector()
