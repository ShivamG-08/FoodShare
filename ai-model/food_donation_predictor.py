import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# Load the dataset
data = pd.read_csv('expanded_food_dataset.csv')

# Preprocessing
# Separate features and target
X = data.drop('donation_status', axis=1)
y = data['donation_status']

# Split into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Create preprocessing pipelines for numeric and categorical features
numeric_features = ['cooked_hours', 'temperature_store']
numeric_transformer = Pipeline(steps=[
    ('scaler', StandardScaler())
])

categorical_features = ['food_type', 'food_name', 'reheated']
categorical_transformer = Pipeline(steps=[
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

# Combine preprocessing steps
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

# Create and train the model
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced'  # Handle class imbalance
    ))
])

model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate the model
print("Model Evaluation:")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

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
        'cooked_hours': [float(cooked_hours)],
        'temperature_store': [float(temperature_store)],
        'reheated': [reheated]
    })
    
    # Make prediction
    prediction = model.predict(input_data)[0]
    probabilities = model.predict_proba(input_data)[0]
    
    # Get confidence scores
    confidence = {}
    for i, cls in enumerate(model.classes_):
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
