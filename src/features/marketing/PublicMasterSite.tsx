import React from 'react';
import { StoryExperience } from '../story/StoryExperience';

interface PublicMasterSiteProps {
  onStartOnboarding: (templateId?: string) => void;
  onGoToLogin: () => void;
  onGoToPlatformAdmin?: () => void;
  isPlatformAdmin?: boolean;
}

export const PublicMasterSite: React.FC<PublicMasterSiteProps> = ({
  onStartOnboarding,
  onGoToLogin,
  onGoToPlatformAdmin,
  isPlatformAdmin,
}) => {
  return (
    <StoryExperience
      onGoToWorkspace={onGoToLogin}
      onGoToOnboarding={() => onStartOnboarding('template_textile_v1')}
      onGoToLogin={onGoToLogin}
      isPlatformAdmin={isPlatformAdmin}
    />
  );
};
