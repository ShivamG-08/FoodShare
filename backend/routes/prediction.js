const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { spawn } = require('child_process');
const path = require('path');

// @route   POST /api/prediction/check-safety
// @desc    Check if food is safe to donate
// @access  Private
router.post(
  '/check-safety',
  [
    check('foodType', 'Food type is required').isIn(['cooked', 'raw']),
    check('foodName', 'Food name is required').not().isEmpty(),
    check('cookedHours', 'Hours since cooked is required').isFloat({ min: 0 }),
    check('temperatureStore', 'Storage temperature is required').isFloat(),
    check('reheated', 'Reheated status is required').isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { foodType, foodName, cookedHours, temperatureStore, reheated } = req.body;

    try {
      // In a real implementation, you would call your Python model here
      // For now, we'll simulate the prediction with a timeout
      
      // This is a placeholder for the actual model prediction
      // In a real app, you would call your Python script like this:
      /*
      const pythonProcess = spawn('python', [
        path.join(__dirname, '../ai-model/food_donation_predictor.py'),
        foodType,
        foodName,
        cookedHours,
        temperatureStore,
        reheated
      ]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0 || error) {
          console.error(`Python script error: ${error}`);
          return res.status(500).json({ error: 'Error processing prediction' });
        }
        
        try {
          const prediction = JSON.parse(result);
          res.json(prediction);
        } catch (e) {
          console.error('Error parsing prediction result:', e);
          res.status(500).json({ error: 'Error processing prediction result' });
        }
      });
      */

      // Simulate prediction (replace with actual model call)
      setTimeout(() => {
        // Simple logic to determine safety status
        let status = 'not_ok';
        let confidence = 0.0;
        
        if (cookedHours < 2 && temperatureStore <= 4) {
          status = 'ok';
          confidence = 0.9;
        } else if ((cookedHours < 4 && temperatureStore <= 8) || (cookedHours < 2 && temperatureStore <= 15)) {
          status = 'borderline';
          confidence = 0.7;
        } else {
          status = 'not_ok';
          confidence = 0.8;
        }
        
        res.json({
          status,
          confidence: {
            ok: status === 'ok' ? confidence : (1 - confidence) / 2,
            borderline: status === 'borderline' ? confidence : (1 - confidence) / 2,
            not_ok: status === 'not_ok' ? confidence : (1 - confidence) / 2
          },
          message: getSafetyMessage(status, {
            foodType,
            foodName,
            cookedHours,
            temperatureStore,
            reheated
          })
        });
      }, 1000);
      
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).send('Server error');
    }
  }
);

// Helper function to generate safety messages
function getSafetyMessage(status, data) {
  const { foodName, cookedHours, temperatureStore, reheated } = data;
  
  const messages = {
    ok: `Great news! Your ${foodName} is safe to donate. It has been stored at ${temperatureStore}°C for ${cookedHours} hours.`,
    borderline: `Caution: Your ${foodName} is at the edge of safety limits. It has been stored at ${temperatureStore}°C for ${cookedHours} hours.`,
    not_ok: `For safety reasons, we cannot accept this ${foodName} for donation. It has been stored at ${temperatureStore}°C for ${cookedHours} hours.`
  };
  
  if (reheated) {
    messages.borderline += ' Note: This food has been reheated, which can affect its safety.';
    messages.not_ok += ' Reheating food multiple times can increase the risk of foodborne illness.';
  }
  
  return messages[status] || 'Unable to determine food safety.';
}

module.exports = router;
