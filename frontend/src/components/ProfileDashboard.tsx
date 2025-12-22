import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ProfileDisplay from './ProfileDisplay';
import RetryComponent from './RetryComponent';
import { apiWithRetry, ApiError } from '../services/api';
import { User } from '../types';

const ProfileDashboard: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfileData = async () => {
    try {
      setError(null);
      const response = await apiWithRetry.get('/profile');
      setProfileData(response.data.user);
      
      if (!loading) {
        // Only show success message on manual refresh, not initial load
        showSuccess('Profile data refreshed successfully.');
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      
      const apiError = err as ApiError;
      let errorMessage = 'Failed to load profile data. Please try again.';
      
      if (apiError.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (apiError.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view this profile.';
      } else if (apiError.status && apiError.status >= 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (apiError.code === 'TIMEOUT') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (apiError.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
  };

  const handleLogout = () => {
    showInfo('You have been logged out successfully.');
    logout();
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      showInfo('Edit mode disabled.');
    } else {
      showInfo('Edit mode enabled. You can now modify your profile information.');
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
        >
          <RetryComponent
            error="You are not authenticated. Please log in to view your profile."
            onRetry={() => { window.location.href = '/login'; }}
            retryText="Go to Login"
          />
        </Box>
      </Container>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: '#F5F5F5',
        position: 'relative',
        // Add decorative background elements like in the login design
        '&::before': {
          content: '""',
          position: 'absolute',
          top: { xs: '5%', sm: '10%' },
          left: { xs: '2%', sm: '5%' },
          width: { xs: '40px', sm: '60px' },
          height: { xs: '40px', sm: '60px' },
          borderRadius: '50%',
          backgroundColor: '#9AFF47',
          opacity: 0.3,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: { xs: '10%', sm: '15%' },
          right: { xs: '4%', sm: '8%' },
          width: { xs: '30px', sm: '40px' },
          height: { xs: '30px', sm: '40px' },
          borderRadius: '8px',
          backgroundColor: '#E0E0E0',
          opacity: 0.5,
        }
      }}
    >
      {/* Additional decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: '15%', sm: '20%' },
          right: { xs: '5%', sm: '10%' },
          width: { xs: '60px', sm: '80px' },
          height: { xs: '60px', sm: '80px' },
          border: '2px solid #E0E0E0',
          borderRadius: '50%',
          opacity: 0.3,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: '20%', sm: '25%' },
          left: { xs: '4%', sm: '8%' },
          width: { xs: '40px', sm: '50px' },
          height: { xs: '40px', sm: '50px' },
          backgroundColor: '#F0F0F0',
          borderRadius: '12px',
          opacity: 0.4,
        }}
      />

      {/* Header Bar */}
      <Box 
        sx={{ 
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between',
            py: { xs: 1.5, sm: 2 },
            gap: { xs: 2, sm: 0 }
          }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: '#1A1A1A',
                fontWeight: 600,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              Profile Dashboard
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', sm: 'row' },
              alignItems: 'center', 
              gap: { xs: 1, sm: 2 },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' }
            }}>
              <Button
                onClick={handleEditToggle}
                variant="outlined"
                size="small"
                sx={{ 
                  color: isEditing ? '#000000' : '#666666',
                  borderColor: isEditing ? '#9AFF47' : '#E0E0E0',
                  backgroundColor: isEditing ? '#9AFF47' : 'transparent',
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#9AFF47',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    transformOrigin: 'center',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 0,
                  },
                  '&:hover:not(:disabled)::before': {
                    transform: isEditing ? 'scale(0)' : 'scale(35)',
                  },
                  '&:hover:not(:disabled)': {
                    borderColor: '#9AFF47',
                    backgroundColor: isEditing ? '#9AFF47' : 'transparent',
                    color: '#000000',
                    '& .button-text': {
                      color: '#000000',
                      position: 'relative',
                      zIndex: 1,
                    }
                  },
                }}
              >
                <span className="button-text" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                  <EditIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: { xs: 14, sm: 16 } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Box>
                </span>
              </Button>
              
              <Button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                variant="outlined"
                size="small"
                sx={{ 
                  color: '#666666',
                  borderColor: '#E0E0E0',
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#9AFF47',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    transformOrigin: 'center',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 0,
                  },
                  '&:hover:not(:disabled)::before': {
                    transform: 'scale(35)',
                  },
                  '&:hover:not(:disabled)': {
                    borderColor: '#9AFF47',
                    backgroundColor: 'transparent',
                    color: '#000000',
                    '& .button-text': {
                      color: '#000000',
                      position: 'relative',
                      zIndex: 1,
                    }
                  },
                }}
              >
                <span className="button-text" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center' }}>
                  {refreshing ? <CircularProgress size={16} sx={{ mr: { xs: 0, sm: 1 }, color: 'inherit' }} /> : <RefreshIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: { xs: 14, sm: 16 } }} />}
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Refresh
                  </Box>
                </span>
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="contained"
                size="small"
                sx={{ 
                  backgroundColor: '#2C3E50',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #2C3E50',
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#9AFF47',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    transformOrigin: 'center',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 0,
                  },
                  '&:hover:not(:disabled)::before': {
                    transform: 'scale(35)',
                  },
                  '&:hover:not(:disabled)': {
                    backgroundColor: '#2C3E50',
                    borderColor: '#9AFF47',
                    color: '#000000',
                    '& .button-text': {
                      color: '#000000',
                      position: 'relative',
                      zIndex: 1,
                    }
                  },
                }}
              >
                <span className="button-text" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center' }}>
                  <LogoutIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: { xs: 14, sm: 16 } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Logout
                  </Box>
                </span>
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 }, position: 'relative', zIndex: 1 }}>
        {loading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
          >
            <CircularProgress size={40} sx={{ color: '#9AFF47', mb: 2 }} />
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Loading your profile...
            </Typography>
          </Box>
        )}

        {error && (
          <Box 
            sx={{ 
              mb: { xs: 3, sm: 4 },
              p: { xs: 2, sm: 3 },
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: '1px solid #FED7D7',
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#C53030',
                textAlign: 'center',
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {error}
            </Typography>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="contained"
                size="small"
                sx={{ 
                  backgroundColor: '#2C3E50',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  position: 'relative',
                  overflow: 'hidden',
                  border: '2px solid #2C3E50',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#9AFF47',
                    borderRadius: '50%',
                    transform: 'scale(0)',
                    transformOrigin: 'center',
                    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 0,
                  },
                  '&:hover:not(:disabled)::before': {
                    transform: 'scale(35)',
                  },
                  '&:hover:not(:disabled)': {
                    backgroundColor: '#2C3E50',
                    borderColor: '#9AFF47',
                    color: '#000000',
                  },
                  '&:disabled': {
                    backgroundColor: '#E0E0E0',
                    color: '#9E9E9E',
                    borderColor: '#E0E0E0',
                    '&::before': {
                      display: 'none',
                    }
                  },
                }}
              >
                {refreshing ? <CircularProgress size={16} sx={{ mr: 1, color: '#FFF' }} /> : 'Try Again'}
              </Button>
            </Box>
          </Box>
        )}

        {!loading && !error && profileData && (
          <Box>
            <Box 
              sx={{ 
                backgroundColor: '#FFFFFF',
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: '1px solid #E0E0E0',
                p: { xs: 3, sm: 4 },
                mb: { xs: 3, sm: 4 },
                textAlign: 'center'
              }}
            >
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ 
                  color: '#1A1A1A',
                  fontWeight: 600,
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                Welcome back, {profileData.firstName}!
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: '#666666' }}
              >
                Your secure profile information
              </Typography>
            </Box>
            
            <ProfileDisplay user={profileData} isEditing={isEditing} onSave={fetchProfileData} />
          </Box>
        )}

        {!loading && !error && !profileData && (
          <Box 
            sx={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E0E0E0',
              p: { xs: 3, sm: 4 },
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#666666',
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              No profile data available. Please try refreshing the page.
            </Typography>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="contained"
              sx={{ 
                backgroundColor: '#2C3E50',
                color: '#FFFFFF',
                borderRadius: '20px',
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid #2C3E50',
                '&:hover': {
                  transform: 'none',
                  boxShadow: 'none',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#9AFF47',
                  borderRadius: '50%',
                  transform: 'scale(0)',
                  transformOrigin: 'center',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 0,
                },
                '&:hover:not(:disabled)::before': {
                  transform: 'scale(35)',
                },
                '&:hover:not(:disabled)': {
                  backgroundColor: '#2C3E50',
                  borderColor: '#9AFF47',
                  color: '#000000',
                  '& > *': {
                    position: 'relative',
                    zIndex: 1,
                    color: '#000000',
                  }
                },
                '&:disabled': {
                  backgroundColor: '#E0E0E0',
                  color: '#9E9E9E',
                  borderColor: '#E0E0E0',
                  '&::before': {
                    display: 'none',
                  }
                },
              }}
            >
              {refreshing ? <CircularProgress size={16} sx={{ mr: 1, color: '#FFF' }} /> : 'Refresh Profile'}
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProfileDashboard;