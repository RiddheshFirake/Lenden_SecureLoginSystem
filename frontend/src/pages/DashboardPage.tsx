import React from 'react';
import ProfileDashboard from '../components/ProfileDashboard';
import ErrorBoundary from '../components/ErrorBoundary';

const DashboardPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProfileDashboard />
    </ErrorBoundary>
  );
};

export default DashboardPage;