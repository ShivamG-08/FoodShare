import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score, confusion_matrix
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

# Optional: toggle to use XGBoost instead of RandomForest
USE_XGBOOST = False  # Set to True to try XGBoost (requires xgboost installed)

# Load the dataset
data = pd.read_csv('expanded_food_dataset.csv')

# Basic cleaning/business rule: raw items should have 0 cooked_hours
if 'food_type' in data.columns and 'cooked_hours' in data.columns:
    data.loc[data['food_type'] == 'raw', 'cooked_hours'] = 0

# Convert 'reheated' boolean to numeric 0/1
if 'reheated' in data.columns:
    # Handle string/boolean to int robustly
    data['reheated'] = data['reheated'].apply(lambda v: 1 if str(v).strip().lower() in ['true', '1', 'yes'] else 0).astype(int)

# Preprocessing
# Separate features and target
X = data.drop('donation_status', axis=1)
y = data['donation_status']

# Split into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Create preprocessing pipelines for numeric and categorical features
# Treat 'reheated' as numeric now
numeric_features = ['cooked_hours', 'temperature_store', 'reheated']
numeric_transformer = Pipeline(steps=[
    ('scaler', StandardScaler())
])

# Remove 'reheated' from categorical since it's numeric
categorical_features = ['food_type', 'food_name']
categorical_transformer = Pipeline(steps=[
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

# Combine preprocessing steps
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

# Create and train the model with SMOTE inside an imblearn Pipeline
# Optionally switch between RandomForest and XGBoost classifier
if USE_XGBOOST:
    try:
        from xgboost import XGBClassifier
        classifier = XGBClassifier(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.0,
            random_state=42,
            objective='multi:softprob',
            eval_metric='mlogloss'
        )
    except ImportError:
        # Fallback to RandomForest if XGBoost not installed
        classifier = RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            class_weight='balanced_subsample',
            max_features='sqrt',
            min_samples_leaf=2
        )
else:
    classifier = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight='balanced_subsample',
        max_features='sqrt',
        min_samples_leaf=2
    )

model = ImbPipeline(steps=[
    ('preprocessor', preprocessor),
    ('smote', SMOTE(random_state=42)),
    ('classifier', classifier)
])

model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
print("Model Evaluation:")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
print(f"Macro F1: {f1_score(y_test, y_pred, average='macro'):.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion matrix numeric and heatmap
classes = model.named_steps['classifier'].classes_
cm = confusion_matrix(y_test, y_pred, labels=classes)
print("\nConfusion Matrix (rows=true, cols=pred):")
print(cm)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
plt.xlabel('Predicted')
plt.ylabel('True')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.savefig('confusion_matrix.png')
print("Confusion matrix plot saved to 'confusion_matrix.png'")

# Save the model
joblib.dump(model, 'food_donation_model.joblib')
print("\nModel saved as 'food_donation_model.joblib'")

def predict_donation_status(food_type, food_name, cooked_hours, temperature_store, reheated):
    """
    Predict if food is okay to donate
    
    Args:
        food_type (str): 'cooked' or 'raw'
        food_name (str): Name of the food item
        cooked_hours (int/float): Hours since food was cooked (0 for raw)
        temperature_store (int/float): Storage temperature in Celsius
        reheated (bool): Whether the food was reheated
        
    Returns:
        dict: Prediction and confidence scores
    """
    # Create input DataFrame
    input_data = pd.DataFrame({
        'food_type': [food_type],
        'food_name': [food_name],
        'cooked_hours': [0.0 if str(food_type).strip().lower() == 'raw' else float(cooked_hours)],
        'temperature_store': [float(temperature_store)],
        'reheated': [1 if str(reheated).strip().lower() in ['true', '1', 'yes'] else 0]
    })
    
    # Make prediction
    prediction = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]
    
    # Get confidence scores
    confidence = {}
    classes = model.named_steps['classifier'].classes_
    for i, cls in enumerate(classes):
        confidence[cls] = float(probabilities[i])
    
    return {
        'prediction': prediction,
        'confidence': confidence
    }

# Example usage
if __name__ == "__main__":
    # Test with example data
    example = {
        'food_type': 'cooked',
        'food_name': 'Pasta',
        'cooked_hours': 4,
        'temperature_store': 5,
        'reheated': True
    }
    
    result = predict_donation_status(**example)
    print("\nExample Prediction:")
    print(f"Input: {example}")
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']}")

# Print top 10 most important features
try:
    ohe = model.named_steps['preprocessor'].named_transformers_['cat'].named_steps['onehot']
    cat_feature_names = list(ohe.get_feature_names_out(categorical_features))
except Exception:
    cat_feature_names = []

feature_names = numeric_features + cat_feature_names
try:
    importances = model.named_steps['classifier'].feature_importances_
    idx = np.argsort(importances)[::-1][:10]
    print("\nTop 10 Feature Importances:")
    for rank, i in enumerate(idx, start=1):
        fname = feature_names[i] if i < len(feature_names) else f"feat_{i}"
        print(f"{rank}. {fname}: {importances[i]:.4f}")
except AttributeError:
    print("\nClassifier does not expose feature_importances_ (e.g., some XGBoost settings). Skipping feature importance print.")
