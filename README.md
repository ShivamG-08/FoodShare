# FoodShare

A platform connecting food donors with receivers to reduce food waste and help those in need. The application includes AI-powered food freshness prediction to ensure food quality.

## Project Structure

```
FoodShare/
├── ai-model/                     # AI Model for food freshness prediction
│   ├── train_model.py           # Script to train the food freshness model
│   ├── predict.py               # Script to make predictions using the trained model
│   ├── food_freshness_model.pkl  # Trained model file
│   ├── label_encoder.pkl        # Label encoder for model predictions
│   └── expanded_food_dataset.csv # Dataset used for training
│
├── backend/                     # Backend server (Node.js/Express)
│   ├── models/
│   │   └── User.js             # User model and schema
│   ├── routes/
│   │   └── auth.js             # Authentication routes
│   ├── server.js                # Main server file
│   ├── package.json             # Backend dependencies
│   └── package-lock.json
│
├── frontend/                    # Frontend application (React)
│   ├── public/
│   │   ├── index.html          # Main HTML file
│   │   ├── favicon.ico         # Website icon
│   │   ├── logo192.png         # App logo (192x192)
│   │   ├── logo512.png         # App logo (512x512)
│   │   ├── manifest.json       # Web app manifest
│   │   └── robots.txt          # Instructions for web crawlers
│   │
│   ├── src/
│   │   ├── pages/              # React components for different pages
│   │   │   ├── DonorDashboard.js    # Donor interface
│   │   │   ├── DonorDashboard.css
│   │   │   ├── ReceiverDashboard.js # Receiver interface
│   │   │   ├── ReceiverDashboard.css
│   │   │   ├── Login.js             # Login page
│   │   │   ├── Login.css
│   │   │   ├── Signup.js            # Registration page
│   │   │   ├── Signup.css
│   │   │   └── Prediction.js        # Food prediction interface
│   │   │
│   │   ├── App.js              # Main App component
│   │   ├── App.css             # Global styles
│   │   ├── App.test.js         # Test file for App component
│   │   ├── index.js            # Application entry point
│   │   ├── index.css           # Global styles
│   │   ├── logo.svg            # React logo
│   │   ├── reportWebVitals.js  # Performance monitoring
│   │   └── setupTests.js       # Test setup configuration
│   │
│   ├── package.json            # Frontend dependencies
│   └── package-lock.json
│
├── .gitignore                  # Specifies intentionally untracked files to ignore
└── requirements.txt            # Python dependencies for the AI model
```

## Features

- **User Authentication**: Secure login and registration system for donors and receivers
- **AI-Powered Prediction**: Predicts food freshness using machine learning
- **Donor Dashboard**: Interface for food donors to list available food items
- **Receiver Dashboard**: Interface for receivers to browse and request available food
- **Responsive Design**: Works on both desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.7 or higher)
- npm or yarn
- MongoDB (for the database)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FoodShare
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up the AI model**
   ```bash
   cd ../ai-model
   pip install -r ../requirements.txt
   ```

## Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   node server.js
   ```

2. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm start
   ```

3. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/) - Frontend library
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database
