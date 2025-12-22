import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
  withLoading: <T>(
    promise: Promise<T>, 
    message?: string
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const setLoading = (loading: boolean, message: string = 'Loading...') => {
    setIsLoading(loading);
    setLoadingMessage(message);
  };

  const withLoading = async <T,>(
    promise: Promise<T>, 
    message: string = 'Loading...'
  ): Promise<T> => {
    setLoading(true, message);
    try {
      const result = await promise;
      return result;
    } finally {
      setLoading(false);
    }
  };

  const value: LoadingContextType = {
    isLoading,
    loadingMessage,
    setLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      
      {/* Global loading backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
        }}
        open={isLoading}
      >
        <CircularProgress color="inherit" size={60} />
        <Box textAlign="center">
          <Typography variant="h6" component="div">
            {loadingMessage}
          </Typography>
          <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
            Please wait...
          </Typography>
        </Box>
      </Backdrop>
    </LoadingContext.Provider>
  );
};