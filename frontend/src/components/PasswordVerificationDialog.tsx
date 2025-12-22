import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from '@mui/icons-material';
import { apiWithRetry } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

interface PasswordVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  message?: string;
}

const PasswordVerificationDialog: React.FC<PasswordVerificationDialogProps> = ({
  open,
  onClose,
  onVerified,
  title = 'Verify Your Password',
  message = 'Please enter your password to continue with editing your profile.',
}) => {
  const { showError } = useNotification();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      await apiWithRetry.post('/profile/verify-password', { password });
      setPassword('');
      onVerified();
      onClose();
    } catch (err: any) {
      let errorMessage = 'Password verification failed';
      
      if (err.status === 401) {
        errorMessage = 'Incorrect password. Please try again.';
        // Clear password field for security and ease of retry
        setPassword('');
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !verifying) {
      handleVerify();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: 'rgba(154, 255, 71, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon sx={{ color: '#9AFF47', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Security verification required
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" sx={{ mb: 3, color: '#666666' }}>
          {message}
        </Typography>

        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error}
          disabled={verifying}
          autoFocus
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={verifying}
                  size="small"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
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
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={verifying}
          sx={{
            color: '#666666',
            textTransform: 'none',
            borderRadius: '20px',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          disabled={verifying || !password.trim()}
          variant="contained"
          sx={{
            backgroundColor: '#2C3E50',
            color: '#FFFFFF',
            borderRadius: '20px',
            textTransform: 'none',
            px: 3,
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
              '& > *': {
                position: 'relative',
                zIndex: 1,
                color: '#000000',
              },
            },
            '&:disabled': {
              backgroundColor: '#E0E0E0',
              color: '#9E9E9E',
              borderColor: '#E0E0E0',
              '&::before': {
                display: 'none',
              },
            },
          }}
        >
          {verifying ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
              Verifying...
            </>
          ) : (
            'Verify Password'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordVerificationDialog;