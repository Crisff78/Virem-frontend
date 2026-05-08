import React from 'react';
import LiveKitVideoContainer from './LiveKitVideoContainer';

type Props = {
  participant: any;
  enabled: boolean;
  avatarLabel?: string;
};

const LocalVideo: React.FC<Props> = ({ participant, enabled, avatarLabel }) => {
  return (
    <LiveKitVideoContainer
      participant={participant}
      mode="local"
      enabled={enabled}
      avatarLabel={avatarLabel}
    />
  );
};

export default LocalVideo;
