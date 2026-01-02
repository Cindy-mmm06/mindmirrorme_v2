import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { del } from 'aws-amplify/api';

type UserInfo = {
  username: string;
  userId: string;
};

type UserProfileProps = {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: (() => void) | undefined;
};

function UserProfile({ isOpen, onClose, onSignOut }: UserProfileProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  const fetchUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setUserInfo({
        username: user.signInDetails?.loginId || user.username,
        userId: user.userId
      });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // API endpoint should delete user account and all associated data
      // Expected response: 200 OK on successful deletion
      await del({
        apiName: 'Blueprint-API',
        path: '/user/delete'
      }).response;
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>Account Information</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="profile-content">
          {userInfo ? (
            <div className="user-info">
              <div className="info-item">
                <label>Email</label>
                <p>{userInfo.username}</p>
              </div>
            </div>
          ) : (
            <p>Loading account information...</p>
          )}
        </div>

        <div className="profile-actions">
          <button 
            className="profile-action-button"
            onClick={() => onSignOut && onSignOut()}
          >
            Sign Out
          </button>
          
          {!showDeleteConfirm ? (
            <button 
              className="profile-action-button delete-style"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete My Account
            </button>
          ) : (
            <div className="delete-confirmation">
              <p>Are you sure? This will permanently delete your account and all data.</p>
              <div className="confirm-buttons">
                <button 
                  className="confirm-delete-button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button 
                  className="cancel-button"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;