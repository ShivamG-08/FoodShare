# FoodShare

A platform connecting food donors with those in need, reducing food waste and fighting hunger in local communities.

## Project Structure

```
FoodShare/
│
├── ai-model/                     # AI model for food freshness prediction
│   ├── food_freshness_model.pkl  # Trained model file
│   ├── label_encoder.pkl         # Label encoder for model predictions
│   ├── metadata.csv.xlsx         # Dataset metadata
│   └── predict.py               # Prediction script
│
├── backend/                      # Backend server
│   ├── models/
│   │   └── User.js              # User model definition
│   ├── routes/
│   │   └── auth.js              # Authentication routes
│   ├── node_modules/             # Dependencies
│   ├── package-lock.json        # NPM lock file
│   └── server.js                # Main server file
│
└── frontend/                     # React frontend
    ├── public/                  # Static files
    │   ├── index.html
    │   ├── favicon.ico
    │   └── ...
    ├── src/
    │   ├── pages/               # React components
    │   │   ├── Login.js         # Login page
    │   │   ├── ReceiverDashboard.js  # Dashboard for food receivers
    │   │   └── ...
    │   ├── App.js               # Main App component
    │   ├── App.css
    │   └── ...
    ├── package.json
    └── ...
```

## Features

- User authentication (Donor/Receiver)
- Food donation listing and management
- Food freshness prediction using AI
- Real-time notifications
- Location-based food availability

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI/ML**: Python, scikit-learn
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python 3.7+
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FoodShare.git
   cd FoodShare
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your configuration
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Update .env with your API endpoints
   ```

4. **Setup AI Model**
   ```bash
   cd ../ai-model
   pip install -r requirements.txt
   ```

### Running the Application

1. Start MongoDB service
2. In the backend directory: `npm start`
3. In the frontend directory: `npm start`
4. The application should be running at `http://localhost:3000`

## Contact

Shivam Gupta - shivamgupta720896@gmail.com
Project Link: https://github.com/ShivamG-08/FoodShare


mongodb pass :- b93iZ9cexTIto1MB
mongodb+srv://moretaniya27_db_user:b93iZ9cexTIto1MB@cluster0.t1zzrdi.mongodb.net/?appName=Cluster0