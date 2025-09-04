import pandas as pd
import joblib
import sys
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def predict_freshness(data):
    """Loads the model and predicts the freshness of a new data sample."""
    try:
        model = joblib.load(os.path.join(BASE_DIR, 'food_freshness_model.pkl'))
        le = joblib.load(os.path.join(BASE_DIR, 'label_encoder.pkl'))
        print("Model and label encoder loaded successfully.")
    except FileNotFoundError:
        print("Error: Model or label encoder not found. Please run train_model.py first.")
        return

    # Convert input data to a DataFrame
    df_new = pd.DataFrame(data, index=[0])

    # Preprocess the new data using one-hot encoding
    df_new = pd.get_dummies(df_new)

    # Align columns with the training data
    # Load training columns to ensure consistency
    train_cols = model.feature_names_in_
    df_new = df_new.reindex(columns=train_cols, fill_value=0)

    # Make a prediction
    prediction_encoded = model.predict(df_new)
    prediction = le.inverse_transform(prediction_encoded)
    return prediction[0]

if __name__ == "__main__":
    
    input_json = sys.argv[1]
    input_data = json.loads(input_json)
    result = predict_freshness(input_data)
    print(result)
