import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface Application {
  opportunityId: string;
  opportunityTitle: string;
  company: string;
  status: 'applied' | 'interviewing' | 'accepted' | 'rejected' | 'waitlisted';
  dateApplied: Date;
  notes?: string;
}

interface ApplicationsContextType {
  applications: Application[];
  addApplication: (application: Omit<Application, 'dateApplied'>) => void;
  updateApplicationStatus: (opportunityId: string, status: Application['status']) => void;
  removeApplication: (opportunityId: string) => void;
  hasApplied: (opportunityId: string) => boolean;
  getApplication: (opportunityId: string) => Application | undefined;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

export const useApplications = () => {
  const context = useContext(ApplicationsContext);
  if (context === undefined) {
    throw new Error('useApplications must be used within an ApplicationsProvider');
  }
  return context;
};

interface ApplicationsProviderProps {
  children: ReactNode;
}

export const ApplicationsProvider: React.FC<ApplicationsProviderProps> = ({ children }) => {
  const [applications, setApplications] = useState<Application[]>([]);

  const addApplication = (applicationData: Omit<Application, 'dateApplied'>) => {
    const newApplication: Application = {
      ...applicationData,
      dateApplied: new Date(),
    };
    
    setApplications(prev => {
      // Check if application already exists
      const exists = prev.some(app => app.opportunityId === applicationData.opportunityId);
      if (exists) {
        return prev; // Don't add duplicate
      }
      return [...prev, newApplication];
    });
  };

  const updateApplicationStatus = (opportunityId: string, status: Application['status']) => {
    setApplications(prev => 
      prev.map(app => 
        app.opportunityId === opportunityId 
          ? { ...app, status } 
          : app
      )
    );
  };

  const removeApplication = (opportunityId: string) => {
    setApplications(prev => 
      prev.filter(app => app.opportunityId !== opportunityId)
    );
  };

  const hasApplied = (opportunityId: string) => {
    return applications.some(app => app.opportunityId === opportunityId);
  };

  const getApplication = (opportunityId: string) => {
    return applications.find(app => app.opportunityId === opportunityId);
  };

  return (
    <ApplicationsContext.Provider value={{ 
      applications, 
      addApplication, 
      updateApplicationStatus, 
      removeApplication, 
      hasApplied, 
      getApplication 
    }}>
      {children}
    </ApplicationsContext.Provider>
  );
}; 