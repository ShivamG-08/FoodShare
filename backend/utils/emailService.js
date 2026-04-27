const User = require('../models/User');
const { sendEmail } = require('./sendEmail');

// Send task notification email to all volunteers
const sendTaskEmail = async (task) => {
  try {
    // Get all approved volunteers
    const volunteers = await User.find({
      role: 'volunteer',
      status: 'approved'
    }).select('name email');

    if (volunteers.length === 0) {
      console.log('No volunteers found to send task notification');
      return;
    }

    // Prepare email content
    const subject = `New Delivery Task Available - ${task.donation?.food || 'Food Items'}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">New Delivery Task Available</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">FoodShare Volunteer Opportunity</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Task Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #666;">Food Item:</strong>
                <p style="margin: 5px 0; color: #333; font-size: 16px;">${task.donation?.food || 'Food Items'}</p>
              </div>
              <div>
                <strong style="color: #666;">Quantity:</strong>
                <p style="margin: 5px 0; color: #333; font-size: 16px;">${task.donation?.quantity || 'Not specified'}</p>
              </div>
              <div>
                <strong style="color: #666;">Priority:</strong>
                <p style="margin: 5px 0;">
                  <span style="background: ${getPriorityColor(task.priority)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                    ${task.priority}
                  </span>
                </p>
              </div>
              <div>
                <strong style="color: #666;">Posted:</strong>
                <p style="margin: 5px 0; color: #333; font-size: 14px;">${new Date(task.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Pickup Information</h3>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; color: #333;"><strong>From:</strong> ${task.donor?.name || 'Donor'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Address:</strong> ${task.pickupAddress}</p>
              ${task.donor?.email ? `<p style="margin: 5px 0; color: #333;"><strong>Contact:</strong> ${task.donor.email}</p>` : ''}
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Delivery Information</h3>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
              <p style="margin: 0; color: #333;"><strong>To:</strong> ${task.receiver?.name || 'Receiver'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Address:</strong> ${task.deliveryAddress}</p>
              ${task.receiver?.email ? `<p style="margin: 5px 0; color: #333;"><strong>Contact:</strong> ${task.receiver.email}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/volunteer-dashboard" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              View Task Details
            </a>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 20px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Note:</strong> This task is available on a first-come, first-served basis. Please accept it promptly if you're interested.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>This is an automated notification from FoodShare. Please do not reply to this email.</p>
          <p>To unsubscribe from these notifications, please update your preferences in your dashboard.</p>
        </div>
      </div>
    `;

    // Send email to all volunteers
    const emailPromises = volunteers.map(volunteer => {
      return sendEmail(volunteer.email, subject, htmlContent);
    });

    await Promise.all(emailPromises);
    console.log(`Task notification sent to ${volunteers.length} volunteers`);

    // Update task to mark email as sent
    task.notificationsSent.email = true;
    await task.save();

  } catch (error) {
    console.error('Error sending task email:', error);
    throw error;
  }
};

// Send task status update email
const sendTaskStatusEmail = async (task, status, recipientEmails) => {
  try {
    const statusMessages = {
      accepted: 'Task has been accepted by a volunteer',
      picked_up: 'Volunteer has picked up the items',
      in_transit: 'Volunteer is on the way to deliver',
      delivered: 'Items have been delivered successfully'
    };

    const subject = `Task Status Update: ${statusMessages[status]}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Task Status Update</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">FoodShare Delivery Progress</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">${statusMessages[status]}</h2>
            <div>
              <strong style="color: #666;">Food Item:</strong>
              <p style="margin: 5px 0; color: #333; font-size: 16px;">${task.donation?.food || 'Food Items'}</p>
            </div>
            <div style="margin-top: 10px;">
              <strong style="color: #666;">Updated:</strong>
              <p style="margin: 5px 0; color: #333; font-size: 14px;">${new Date().toLocaleString()}</p>
            </div>
          </div>

          ${task.volunteer ? `
            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Volunteer Information</h3>
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: #333;"><strong>Name:</strong> ${task.volunteer?.name || 'Volunteer'}</p>
                ${task.volunteer?.email ? `<p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${task.volunteer.email}</p>` : ''}
              </div>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;">
              View in Dashboard
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>This is an automated notification from FoodShare. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send email to specified recipients
    const emailPromises = recipientEmails.map(email => {
      return sendEmail(email, subject, htmlContent);
    });

    await Promise.all(emailPromises);
    console.log(`Task status update sent to ${recipientEmails.length} recipients`);

  } catch (error) {
    console.error('Error sending task status email:', error);
    throw error;
  }
};

// Helper function to get priority color
function getPriorityColor(priority) {
  const colors = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
    urgent: '#9C27B0'
  };
  return colors[priority] || '#666';
}

// Send task assignment email to specific volunteer
const sendTaskAssignmentEmail = async (task, volunteer) => {
  try {
    const subject = `Task Assigned: ${task.donation?.food || 'Food Items'} - FoodShare`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Task Auto-Assigned!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been selected for this delivery</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Task Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #666;">Food Item:</strong>
                <p style="margin: 5px 0; color: #333; font-size: 16px;">${task.donation?.food || 'Food Items'}</p>
              </div>
              <div>
                <strong style="color: #666;">Quantity:</strong>
                <p style="margin: 5px 0; color: #333; font-size: 16px;">${task.donation?.quantity || 'Not specified'}</p>
              </div>
              <div>
                <strong style="color: #666;">Priority:</strong>
                <p style="margin: 5px 0;">
                  <span style="background: ${getPriorityColor(task.priority)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
                    ${task.priority}
                  </span>
                </p>
              </div>
              <div>
                <strong style="color: #666;">Assigned:</strong>
                <p style="margin: 5px 0; color: #333; font-size: 14px;">${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Why You Were Selected</h3>
            <p style="margin: 0; color: #333; font-size: 14px;">
              You were automatically selected based on your proximity, performance rating, and availability. 
              This task matches your profile perfectly!
            </p>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Pickup Information</h3>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
              <p style="margin: 0; color: #333;"><strong>From:</strong> ${task.donor?.name || 'Donor'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Address:</strong> ${task.pickupAddress}</p>
              ${task.donor?.phone ? `<p style="margin: 5px 0; color: #333;"><strong>Contact:</strong> ${task.donor.phone}</p>` : ''}
              ${task.donor?.email ? `<p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${task.donor.email}</p>` : ''}
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Delivery Information</h3>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
              <p style="margin: 0; color: #333;"><strong>To:</strong> ${task.receiver?.name || 'Receiver'}</p>
              <p style="margin: 5px 0; color: #333;"><strong>Address:</strong> ${task.deliveryAddress}</p>
              ${task.receiver?.phone ? `<p style="margin: 5px 0; color: #333;"><strong>Contact:</strong> ${task.receiver.phone}</p>` : ''}
              ${task.receiver?.email ? `<p style="margin: 5px 0; color: #333;"><strong>Email:</strong> ${task.receiver.email}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/volunteer-dashboard" 
               style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
              View Task Details
            </a>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 20px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Important:</strong> This task has been automatically assigned to you. Please check your dashboard and confirm if you can complete this delivery.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>This is an automated notification from FoodShare. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    await sendEmail(volunteer.email, subject, htmlContent);
    console.log(`Task assignment email sent to volunteer: ${volunteer.email}`);

  } catch (error) {
    console.error('Error sending task assignment email:', error);
    throw error;
  }
};

module.exports = {
  sendTaskEmail,
  sendTaskStatusEmail,
  sendTaskAssignmentEmail
};
