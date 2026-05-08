import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

type Props = {
  config: {
    domain: string;
    roomName: string;
    displayName: string;
    userId: string;
  };
  onEnd?: () => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const JitsiVideoContainer: React.FC<Props> = ({ config, onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    const domain = config.domain || 'meet.jit.si';
    const scriptId = 'jitsi-external-api';
    
    const loadJitsi = () => {
      if (!containerRef.current) return;
      
      const options = {
        roomName: config.roomName,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: config.displayName,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'e2ee'
          ],
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      
      if (onEnd) {
        apiRef.current.addEventListener('readyToClose', onEnd);
        apiRef.current.addEventListener('videoConferenceLeft', onEnd);
      }
    };

    if (window.JitsiMeetExternalAPI) {
      loadJitsi();
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = loadJitsi;
      document.body.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [config, onEnd]);

  return (
    <View style={styles.container}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default JitsiVideoContainer;
