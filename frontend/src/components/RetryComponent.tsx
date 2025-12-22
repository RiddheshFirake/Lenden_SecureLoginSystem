import React, { useState } from 'react';
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface RetryComponentProps {
  error: string;
  onRetry: () => Promise<void> | void;
  retryText?: string;
  showDetails?: boolean;
  errorDetails?: string;
  maxRetries?: number;
  disabled?: boolean;
}

const RetryComponent: React.FC<RetryComponentProps> = ({
  error,
  onRetry,
  retryText = 'Try Again',
  showDetails = false,
  errorDetails,
  maxRetries = 3,
  disabled = false,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries || disabled) {
      return;
    }

    setRetrying(true);
    try {
      await onRetry();
      setRetryCount(0); // Reset on success
    } catch (error) {
      setRetryCount(prev => prev + 1);
    } finally {
      setRetrying(false);
    }
  };

  const isMaxRetriesReached = retryCount >= maxRetries;

  return (
    <Box>
      <Alert 
        severity="error"
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(244, 67, 54, 0.2)',
          backgroundColor: 'rgba(244, 67, 54, 0.05)',
          '& .MuiAlert-icon': {
            color: '#D32F2F',
          },
        }}
        action={
          <Button
            variant="contained"
            size="small"
            onClick={handleRetry}
            disabled={retrying || isMaxRetriesReached || disabled}
            startIcon={retrying ? <CircularProgress size={16} sx={{ color: '#000' }} /> : <RefreshIcon />}
            sx={{
              minWidth: 'auto',
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
            }}
          >
            {retrying ? 'Retrying...' : retryText}
          </Button>
        }
      >
        <Box>
          <Typography variant="body2">
            {error}
          </Typography>
          
          {retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Retry attempt {retryCount} of {maxRetries}
            </Typography>
          )}
          
          {isMaxRetriesReached && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
              Maximum retry attempts reached. Please refresh the page or contact support.
            </Typography>
          )}
          
          {showDetails && errorDetails && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                endIcon={showErrorDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ p: 0, minWidth: 'auto' }}
              >
                <Typography variant="caption">
                  {showErrorDetails ? 'Hide' : 'Show'} Details
                </Typography>
              </Button>
              
              <Collapse in={showErrorDetails}>
                <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" component="pre" sx={{ 
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {errorDetails}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      </Alert>
    </Box>
  );
};

export default RetryComponent;