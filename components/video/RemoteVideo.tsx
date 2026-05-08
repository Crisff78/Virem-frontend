import React from 'react';
import LiveKitVideoContainer from './LiveKitVideoContainer';

type Props = {
  participant: any;
  enabled: boolean;
  fullscreen?: boolean;
  avatarLabel?: string;
};

const RemoteVideo: React.FC<Props> = ({ participant, enabled, fullscreen, avatarLabel }) => {
  return (
    <LiveKitVideoContainer
      participant={participant}
      mode="remote"
      enabled={enabled}
      fullscreen={fullscreen}
      avatarLabel={avatarLabel}
    />
  );
};

export default RemoteVideo;
