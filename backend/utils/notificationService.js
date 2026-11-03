const Notification = require('../models/Notification');

/**
 * Creates an in-app notification for a user.
 * @param {Object} params
 * @param {string|ObjectId} params.recipientUser - Target user ID
 * @param {string} params.message - Notification message
 * @param {string} [params.relatedType='system'] - 'donation' | 'wasteRequest' | 'pickup' | 'organization' | 'system'
 * @param {string|ObjectId} [params.relatedId=null] - Linked document ID
 * @returns {Promise<Notification>}
 */
const createNotification = async ({
  recipientUser,
  message,
  relatedType = 'system',
  relatedId = null
}) => {
  try {
    const notification = await Notification.create({
      recipientUser,
      message,
      relatedType,
      relatedId
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Sends notifications to multiple users (e.g. system broadcast).
 */
const sendBulkNotifications = async (
  userIds,
  message,
  relatedType = 'system',
  relatedId = null
) => {
  try {
    const docs = userIds.map((userId) => ({
      recipientUser: userId,
      message,
      relatedType,
      relatedId
    }));
    return await Notification.insertMany(docs);
  } catch (error) {
    console.error('Failed to send bulk notifications:', error.message);
    return [];
  }
};

module.exports = {
  createNotification,
  sendBulkNotifications
};

// In-app events commit together with their associated business operation.
const queueNotifications = async (
  userIds,
  message,
  relatedType,
  relatedId,
  session
) => {
  const recipients = [...new Set(userIds.filter(Boolean).map(String))];
  if (!recipients.length) return;
  await Notification.insertMany(
    recipients.map((recipientUser) => ({
      recipientUser,
      message,
      relatedType,
      relatedId
    })),
    { session }
  );
};
module.exports.queueNotifications = queueNotifications;
