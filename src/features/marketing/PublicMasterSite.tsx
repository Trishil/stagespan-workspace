import React from 'react';
import { StoryExperience } from '../story/StoryExperience';

interface PublicMasterSiteProps {
  onStartOnboarding: (templateId?: string) => void;
  onGoToLogin: () => void;
  onGoToPlatformAdmin?: () => void;
  isPlatformAdmin?: boolean;
}

export const PublicMasterSite: React.FC<PublicMasterSiteProps> = ({ onStartOnboarding, onGoToLogin, onGoToPlatformAdmin, isPlatformAdmin }) => (
  <StoryExperience
    onGoToWorkspace={onGoToLogin}
    onGoToOnboarding={() => onStartOnboarding()}
    onGoToLogin={onGoToLogin}
    onGoToPlatformAdmin={onGoToPlatformAdmin}
    isPlatformAdmin={isPlatformAdmin}
  />
);
