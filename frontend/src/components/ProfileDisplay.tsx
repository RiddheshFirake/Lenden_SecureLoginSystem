import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CreditCard as CreditCardIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { User } from '../types';
import { apiWithRetry } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface ProfileDisplayProps {
  user: User;
  isEditing?: boolean;
  onSave?: () => void;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ user, isEditing = false, onSave }) => {
  const { showSuccess, showError } = useNotification();
  const [editData, setEditData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    aadhaarNumber: user.aadhaarNumber || '',
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: keyof typeof editData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let { value } = e.target;
    
    // Format Aadhaar number with spaces for better readability
    if (field === 'aadhaarNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (value.length > 14) { // 12 digits + 2 spaces
        value = value.substring(0, 14);
      }
    }

    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = {
        ...editData,
        aadhaarNumber: editData.aadhaarNumber.replace(/\s/g, '') // Remove spaces
      };
      
      await apiWithRetry.put('/profile', dataToSend);
      showSuccess('Profile updated successfully!');
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const maskAadhaar = (aadhaar?: string) => {
    if (!aadhaar) return 'N/A';
    // Show only last 4 digits for security
    return `XXXX-XXXX-${aadhaar.slice(-4)}`;
  };

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', px: { xs: 0, sm: 0 } }}>
      {/* Main Profile Card */}
      <Card 
        elevation={0} 
        sx={{ 
          mb: { xs: 3, sm: 4 },
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} mb={{ xs: 3, sm: 4 }}>
            <Box
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #9AFF47 0%, #7ED321 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: { xs: 0, sm: 3 },
                mb: { xs: 2, sm: 0 },
              }}
            >
              <PersonIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: '#000' }} />
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom
                sx={{ 
                  color: '#1A1A1A',
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Chip 
                label="✓ Verified Profile" 
                sx={{
                  backgroundColor: 'rgba(154, 255, 71, 0.2)',
                  color: '#2E7D32',
                  fontWeight: 600,
                  border: '1px solid rgba(154, 255, 71, 0.3)',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: { xs: 3, sm: 4 }, borderColor: 'rgba(0, 0, 0, 0.05)' }} />

          {/* Profile Information Grid */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr 1fr' },
              gap: { xs: 3, sm: 4 },
            }}
          >
            {/* Email */}
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(154, 255, 71, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <EmailIcon sx={{ color: '#9AFF47', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Email Address
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                    {user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Email cannot be changed
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Phone */}
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(154, 255, 71, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <PhoneIcon sx={{ color: '#9AFF47', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Phone Number
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={editData.phone}
                      onChange={handleInputChange('phone')}
                      placeholder="+91 98765 43210"
                      variant="outlined"
                      size="small"
                      sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FAFAFA',
                          '& fieldset': {
                            borderColor: '#E0E0E0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#CCCCCC',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9AFF47',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                      {user.phone || 'N/A'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* First Name */}
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(154, 255, 71, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <PersonIcon sx={{ color: '#9AFF47', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    First Name
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={editData.firstName}
                      onChange={handleInputChange('firstName')}
                      placeholder="John"
                      variant="outlined"
                      size="small"
                      sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FAFAFA',
                          '& fieldset': {
                            borderColor: '#E0E0E0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#CCCCCC',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9AFF47',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                      {user.firstName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Last Name */}
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(154, 255, 71, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <PersonIcon sx={{ color: '#9AFF47', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Last Name
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={editData.lastName}
                      onChange={handleInputChange('lastName')}
                      placeholder="Doe"
                      variant="outlined"
                      size="small"
                      sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FAFAFA',
                          '& fieldset': {
                            borderColor: '#E0E0E0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#CCCCCC',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9AFF47',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                      {user.lastName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Aadhaar */}
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(154, 255, 71, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <CreditCardIcon sx={{ color: '#9AFF47', fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Aadhaar Number
                  </Typography>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      value={editData.aadhaarNumber}
                      onChange={handleInputChange('aadhaarNumber')}
                      placeholder="1234 5678 9012"
                      variant="outlined"
                      size="small"
                      sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FAFAFA',
                          '& fieldset': {
                            borderColor: '#E0E0E0',
                          },
                          '&:hover fieldset': {
                            borderColor: '#CCCCCC',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#9AFF47',
                            borderWidth: 2,
                          },
                        },
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                        {maskAadhaar(user.aadhaarNumber)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        🔒 Encrypted and secured
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Member Since */}
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    backgroundColor: 'rgba(154, 255, 71, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                  }}
                >
                  <Typography sx={{ color: '#9AFF47', fontSize: { xs: 16, sm: 20 }, fontWeight: 700 }}>
                    📅
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Member Since
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A', fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                    {formatDate(user.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Save Button - Only show in edit mode */}
          {isEditing && (
            <Box sx={{ mt: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#2C3E50',
                  color: '#FFFFFF',
                  borderRadius: '20px',
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.2, sm: 1.5 },
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
                    '& .button-text': {
                      color: '#000000',
                      position: 'relative',
                      zIndex: 1,
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
                <span className="button-text" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
                  {saving ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <SaveIcon sx={{ mr: 1, fontSize: { xs: 14, sm: 16 } }} />
                      Save Changes
                    </>
                  )}
                </span>
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Security Information Card */}
      <Card 
        elevation={0} 
        sx={{ 
          backgroundColor: 'rgba(154, 255, 71, 0.05)',
          border: '1px solid rgba(154, 255, 71, 0.2)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              color: '#1A1A1A',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            🔐 Security Features
          </Typography>
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: { xs: 2, sm: 3 },
            }}
          >
            <Box textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                AES-256 Encryption
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                Your Aadhaar data is encrypted with military-grade security
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Secure Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                JWT tokens with bcrypt password hashing
              </Typography>
            </Box>
            <Box textAlign="center" sx={{ gridColumn: { xs: '1', sm: '1 / -1', md: 'auto' } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Data Protection
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                All sensitive information is protected and never stored in plain text
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfileDisplay;