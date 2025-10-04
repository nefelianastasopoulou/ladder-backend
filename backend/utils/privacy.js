// Privacy utilities for checking user connections and visibility
const db = require('../database');

/**
 * Check if one user follows another user
 * @param {number} followerId - User who might be following
 * @param {number} followingId - User who might be followed
 * @returns {Promise<boolean>} - True if followerId follows followingId
 */
const doesUserFollow = async (followerId, followingId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id FROM user_follows 
      WHERE follower_id = $1 AND following_id = $2
    `;

    db.query(query, [followerId, followingId], (err, result) => {
      if (err) {
        console.error('Error checking user follow:', err);
        reject(err);
        return;
      }

      resolve(result.rows.length > 0);
    });
  });
};

/**
 * Check if a user can see content based on privacy settings
 * @param {number} viewerId - ID of the user viewing the content
 * @param {number} contentOwnerId - ID of the user who owns the content
 * @param {string} visibilitySetting - Privacy setting: 'everyone', 'followers', 'none'
 * @returns {Promise<boolean>} - True if viewer can see the content
 */
const canUserSeeContent = async (viewerId, contentOwnerId, visibilitySetting) => {
  // If it's the same user, they can always see their own content
  if (viewerId === contentOwnerId) {
    return true;
  }

  // Check visibility setting
  switch (visibilitySetting) {
    case 'everyone':
      return true;
    case 'none':
      return false;
    case 'followers':
      return await doesUserFollow(viewerId, contentOwnerId);
    default:
      // Default to 'everyone' for unknown settings
      return true;
  }
};

/**
 * Get user's privacy settings
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User's privacy settings
 */
const getUserPrivacySettings = async (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        community_posts_visibility,
        opportunities_on_profile_visibility,
        applications_on_profile_visibility
      FROM user_settings 
      WHERE user_id = $1
    `;

    db.query(query, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching user privacy settings:', err);
        reject(err);
        return;
      }

      if (result.rows.length === 0) {
        // Return default settings if none exist
        resolve({
          community_posts_visibility: 'everyone',
          opportunities_on_profile_visibility: 'everyone',
          applications_on_profile_visibility: 'everyone'
        });
        return;
      }

      resolve(result.rows[0]);
    });
  });
};

/**
 * Filter content based on privacy settings
 * @param {Array} content - Array of content items
 * @param {number} viewerId - ID of the user viewing the content
 * @param {string} privacyField - Field name for privacy setting (e.g., 'community_posts_visibility')
 * @returns {Promise<Array>} - Filtered content array
 */
const filterContentByPrivacy = async (content, viewerId, privacyField) => {
  if (!Array.isArray(content) || content.length === 0) {
    return content;
  }

  const filteredContent = [];

  for (const item of content) {
    const contentOwnerId = item.author_id || item.user_id || item.owner_id;
    
    if (!contentOwnerId) {
      // If no owner ID, include the content (shouldn't happen in normal cases)
      filteredContent.push(item);
      continue;
    }

    // Get privacy settings for the content owner
    const privacySettings = await getUserPrivacySettings(contentOwnerId);
    const visibilitySetting = privacySettings[privacyField] || 'everyone';

    // Check if viewer can see this content
    const canSee = await canUserSeeContent(viewerId, contentOwnerId, visibilitySetting);
    
    // TEMPORARY DEBUG: Log privacy filtering details
    if (item.created_by_username === 'admin' || item.created_by_name === 'admin') {
      console.log('Admin opportunity privacy check:', {
        contentOwnerId,
        viewerId,
        privacyField,
        visibilitySetting,
        canSee,
        privacySettings
      });
    }
    
    if (canSee) {
      filteredContent.push(item);
    }
  }

  return filteredContent;
};

module.exports = {
  doesUserFollow,
  canUserSeeContent,
  getUserPrivacySettings,
  filterContentByPrivacy
};
