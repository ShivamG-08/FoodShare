const User = require('../models/User');
const Task = require('../models/Task');
const { sendTaskStatusUpdate } = require('./socketService');

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate volunteer score based on multiple factors
 * @param {Object} volunteer - Volunteer object with performance data
 * @param {number} distance - Distance to task location in km
 * @param {Object} task - Task object
 * @returns {Object} Score breakdown and total score
 */
function calculateVolunteerScore(volunteer, distance, task) {
  const perf = volunteer.volunteerPerformance || {};
  
  // Distance score (0-40 points) - closer is better
  let distanceScore = 0;
  if (distance <= 5) {
    distanceScore = 40;
  } else if (distance <= 10) {
    distanceScore = 30;
  } else if (distance <= 20) {
    distanceScore = 20;
  } else if (distance <= 30) {
    distanceScore = 10;
  } else if (distance <= perf.maxDistance || 50) {
    distanceScore = 5;
  } else {
    distanceScore = 0; // Too far
  }

  // Rating score (0-25 points) - higher rating is better
  const ratingScore = perf.rating * 5;

  // Completion rate score (0-15 points) - higher completion rate is better
  const completionRate = perf.totalDeliveries > 0 
    ? (perf.completedDeliveries / perf.totalDeliveries) * 100 
    : 100;
  const completionScore = (completionRate / 100) * 15;

  // Response time score (0-10 points) - faster response is better
  let responseScore = 0;
  if (perf.averageResponseTime <= 5) {
    responseScore = 10;
  } else if (perf.averageResponseTime <= 15) {
    responseScore = 8;
  } else if (perf.averageResponseTime <= 30) {
    responseScore = 6;
  } else if (perf.averageResponseTime <= 60) {
    responseScore = 4;
  } else {
    responseScore = 2;
  }

  // Availability score (0-10 points) - available volunteers get full points
  const availabilityScore = volunteer.isAvailable ? 10 : 0;

  // Experience bonus (0-5 points) - more deliveries is better
  let experienceBonus = 0;
  if (perf.completedDeliveries >= 100) {
    experienceBonus = 5;
  } else if (perf.completedDeliveries >= 50) {
    experienceBonus = 4;
  } else if (perf.completedDeliveries >= 25) {
    experienceBonus = 3;
  } else if (perf.completedDeliveries >= 10) {
    experienceBonus = 2;
  } else if (perf.completedDeliveries >= 5) {
    experienceBonus = 1;
  }

  // On-time delivery bonus (0-5 points)
  const onTimeBonus = (perf.onTimeDeliveryRate / 100) * 5;

  // Area preference bonus (0-5 points)
  let areaBonus = 0;
  if (perf.preferredAreas && perf.preferredAreas.length > 0) {
    const taskArea = task.pickupAddress || task.deliveryAddress || '';
    const matchingArea = perf.preferredAreas.some(area => 
      taskArea.toLowerCase().includes(area.toLowerCase())
    );
    if (matchingArea) {
      areaBonus = 5;
    }
  }

  const totalScore = distanceScore + ratingScore + completionScore + responseScore + 
                     availabilityScore + experienceBonus + onTimeBonus + areaBonus;

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    breakdown: {
      distance: distanceScore,
      rating: ratingScore,
      completion: completionScore,
      response: responseScore,
      availability: availabilityScore,
      experience: experienceBonus,
      onTime: onTimeBonus,
      area: areaBonus
    },
    distance,
    completionRate,
    rating: perf.rating,
    responseTime: perf.averageResponseTime
  };
}

/**
 * Get available volunteers for task assignment
 * @param {Object} task - Task object
 * @returns {Array} Array of available volunteers with their scores
 */
async function getAvailableVolunteers(task) {
  try {
    // Get all approved volunteers who are available and have location data
    const volunteers = await User.find({
      role: 'volunteer',
      status: 'approved',
      isAvailable: true,
      latitude: { $ne: null },
      longitude: { $ne: null },
      'volunteerPerformance.currentTask': null // Not currently on a task
    }).select('name email phone latitude longitude location isAvailable volunteerPerformance');

    console.log(`Found ${volunteers.length} available volunteers`);

    // Calculate scores for each volunteer
    const volunteersWithScores = volunteers.map(volunteer => {
      const distance = calculateDistance(
        task.pickupCoordinates?.latitude || task.donation?.latitude,
        task.pickupCoordinates?.longitude || task.donation?.longitude,
        volunteer.latitude,
        volunteer.longitude
      );

      // Skip if volunteer is too far
      const maxDistance = volunteer.volunteerPerformance?.maxDistance || 50;
      if (distance > maxDistance) {
        return null;
      }

      return {
        volunteer,
        score: calculateVolunteerScore(volunteer, distance, task)
      };
    }).filter(item => item !== null); // Remove null entries (too far volunteers)

    // Sort by score (highest first)
    volunteersWithScores.sort((a, b) => b.score.totalScore - a.score.totalScore);

    console.log(`Ranked ${volunteersWithScores.length} volunteers by score`);
    volunteersWithScores.forEach((item, index) => {
      console.log(`${index + 1}. ${item.volunteer.name}: ${item.score.totalScore} (distance: ${item.score.distance}km)`);
    });

    return volunteersWithScores;
  } catch (error) {
    console.error('Error getting available volunteers:', error);
    throw error;
  }
}

/**
 * Automatically assign task to best volunteer
 * @param {Object} task - Task object
 * @returns {Object} Assigned volunteer and task
 */
async function autoAssignTask(task) {
  try {
    console.log('Starting auto-assignment for task:', task._id);

    const availableVolunteers = await getAvailableVolunteers(task);

    if (availableVolunteers.length === 0) {
      console.log('No available volunteers found for auto-assignment');
      return {
        success: false,
        message: 'No available volunteers found',
        task
      };
    }

    // Select best volunteer (highest score)
    const bestVolunteer = availableVolunteers[0];
    const volunteer = bestVolunteer.volunteer;

    console.log(`Selected volunteer: ${volunteer.name} with score: ${bestVolunteer.score.totalScore}`);

    // Update task with assigned volunteer
    task.volunteer = volunteer._id;
    task.status = 'accepted';
    task.acceptedAt = new Date();
    task.notificationsSent.socket = true;

    await task.save();

    // Update volunteer's current task and performance
    volunteer.volunteerPerformance.currentTask = task._id;
    volunteer.volunteerPerformance.lastActive = new Date();
    await volunteer.save();

    // Create notification for volunteer
    await require('../models/Notification').create({
      toUserId: volunteer._id,
      type: 'task_auto_assigned',
      title: 'New Task Assigned Automatically',
      message: `You have been automatically assigned a delivery task: ${task.donation?.food || 'Food items'}. Please check your dashboard for details.`,
      meta: {
        taskId: task._id,
        autoAssigned: true,
        score: bestVolunteer.score
      }
    });

    // Send real-time notification to assigned volunteer
    await sendTaskStatusUpdate(task._id, 'auto_assigned', [volunteer._id]);

    // Create notifications for donor and receiver
    await require('../models/Notification').create({
      toUserId: task.donor,
      type: 'task_volunteer_assigned',
      title: 'Volunteer Auto-Assigned',
      message: `${volunteer.name} has been automatically assigned to deliver your donation.`,
      meta: {
        taskId: task._id,
        volunteerId: volunteer._id,
        autoAssigned: true
      }
    });

    await require('../models/Notification').create({
      toUserId: task.receiver,
      type: 'task_volunteer_assigned',
      title: 'Volunteer Auto-Assigned',
      message: `${volunteer.name} has been automatically assigned to deliver your items.`,
      meta: {
        taskId: task._id,
        volunteerId: volunteer._id,
        autoAssigned: true
      }
    });

    // Send email notification to assigned volunteer
    try {
      const { sendTaskAssignmentEmail } = require('../utils/emailService');
      await sendTaskAssignmentEmail(task, volunteer);
    } catch (emailError) {
      console.error('Error sending assignment email:', emailError);
    }

    console.log('Task auto-assignment completed successfully');

    return {
      success: true,
      message: 'Task automatically assigned to best volunteer',
      task: await Task.findById(task._id)
        .populate('donor', 'name email phone')
        .populate('receiver', 'name email phone address')
        .populate('volunteer', 'name email phone')
        .populate('donation', 'food quantity location'),
      assignedVolunteer: volunteer,
      score: bestVolunteer.score,
      allVolunteers: availableVolunteers
    };

  } catch (error) {
    console.error('Error in auto-assignment:', error);
    throw error;
  }
}

/**
 * Update volunteer performance metrics after task completion
 * @param {string} volunteerId - Volunteer ID
 * @param {Object} task - Completed task
 * @param {number} responseTime - Time from task assignment to acceptance (minutes)
 * @param {number} deliveryTime - Time from acceptance to delivery (minutes)
 */
async function updateVolunteerPerformance(volunteerId, task, responseTime, deliveryTime) {
  try {
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return;
    }

    const perf = volunteer.volunteerPerformance;
    
    // Update delivery counts
    perf.totalDeliveries += 1;
    perf.completedDeliveries += 1;
    
    // Update response time (moving average)
    if (responseTime > 0) {
      const totalResponseTime = perf.averageResponseTime * (perf.totalDeliveries - 1) + responseTime;
      perf.averageResponseTime = Math.round((totalResponseTime / perf.totalDeliveries) * 100) / 100;
    }
    
    // Update delivery time (moving average)
    if (deliveryTime > 0) {
      const totalDeliveryTime = perf.averageDeliveryTime * (perf.totalDeliveries - 1) + deliveryTime;
      perf.averageDeliveryTime = Math.round((totalDeliveryTime / perf.totalDeliveries) * 100) / 100;
    }
    
    // Update on-time delivery rate
    const estimatedTime = task.estimatedDeliveryTime;
    if (estimatedTime && task.deliveredAt) {
      const wasOnTime = task.deliveredAt <= estimatedTime;
      const totalOnTime = perf.onTimeDeliveryRate * (perf.totalDeliveries - 1) + (wasOnTime ? 100 : 0);
      perf.onTimeDeliveryRate = Math.round((totalOnTime / perf.totalDeliveries) * 100) / 100;
    }
    
    // Update total distance
    if (task.pickupCoordinates && task.deliveryCoordinates) {
      const distance = calculateDistance(
        task.pickupCoordinates.latitude,
        task.pickupCoordinates.longitude,
        task.deliveryCoordinates.latitude,
        task.deliveryCoordinates.longitude
      );
      perf.totalDistance += distance;
    }
    
    // Clear current task
    perf.currentTask = null;
    perf.lastActive = new Date();
    
    // Update availability (make available again)
    volunteer.isAvailable = true;
    
    await volunteer.save();
    
    console.log(`Updated performance for volunteer ${volunteer.name}:`, {
      completedDeliveries: perf.completedDeliveries,
      averageResponseTime: perf.averageResponseTime,
      averageDeliveryTime: perf.averageDeliveryTime,
      onTimeDeliveryRate: perf.onTimeDeliveryRate
    });
    
  } catch (error) {
    console.error('Error updating volunteer performance:', error);
  }
}

/**
 * Get volunteer performance analytics
 * @param {string} volunteerId - Volunteer ID (optional, for single volunteer)
 * @returns {Object} Performance analytics
 */
async function getVolunteerAnalytics(volunteerId = null) {
  try {
    const matchCondition = volunteerId 
      ? { _id: volunteerId, role: 'volunteer' }
      : { role: 'volunteer' };

    const analytics = await User.aggregate([
      { $match: matchCondition },
      {
        $project: {
          name: 1,
          email: 1,
          volunteerPerformance: 1,
          isAvailable: 1
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$volunteerPerformance.totalDeliveries', 0] },
              {
                $multiply: [
                  { $divide: ['$volunteerPerformance.completedDeliveries', '$volunteerPerformance.totalDeliveries'] },
                  100
                ]
              },
              0
            ]
          },
          performanceScore: {
            $add: [
              { $multiply: ['$volunteerPerformance.rating', 20] }, // Rating (0-100)
              { $multiply: ['$volunteerPerformance.onTimeDeliveryRate', 0.3] }, // On-time rate
              { $cond: [{ $gte: ['$volunteerPerformance.completedDeliveries', 50] }, 10, 0] }, // Experience bonus
              { $cond: [{ $gte: ['$volunteerPerformance.completedDeliveries', 100] }, 20, 0] }
            ]
          }
        }
      },
      { $sort: { performanceScore: -1 } }
    ]);

    return analytics;
  } catch (error) {
    console.error('Error getting volunteer analytics:', error);
    throw error;
  }
}

module.exports = {
  calculateDistance,
  calculateVolunteerScore,
  getAvailableVolunteers,
  autoAssignTask,
  updateVolunteerPerformance,
  getVolunteerAnalytics
};
