import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder
import joblib

def train_food_freshness_model(file_path):
    print(f"Attempting to load dataset from: {file_path}")
    try:
        if file_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
        print("Dataset loaded successfully.")
    except FileNotFoundError:
        print(f"Error: Dataset not found at '{file_path}'. Please check the file path.")
        return
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        return

    target_column = 'donation_status'
    if target_column not in df.columns:
        print(f"Error: Target column '{target_column}' not found in the dataset.")
        return

    X = df.drop(target_column, axis=1)
    y = df[target_column]

    X = pd.get_dummies(X)
    le = LabelEncoder()
    y = le.fit_transform(y)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print("Data preprocessed and split.")

    print("Training model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    print("Model training complete.")

    # Evaluate the model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy:.2f}")
    print("Classification Report:")
    # Use label encoder to get original class names for report
    target_names = le.inverse_transform(sorted(list(set(y))))
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Save the trained model and the label encoder
    print("Saving model and label encoder...")
    joblib.dump(model, 'food_freshness_model.pkl')
    joblib.dump(le, 'label_encoder.pkl')
    print("Model and label encoder saved as 'food_freshness_model.pkl' and 'label_encoder.pkl'.")

if __name__ == "__main__":
    dataset_path = "expanded_food_dataset.csv"
    train_food_freshness_model(dataset_path)
