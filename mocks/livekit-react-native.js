import React from 'react';

// Mock for @livekit/react-native on web
export const LiveKitRoom = ({ children }) => <>{children}</>;
export const VideoTrack = () => null;
export const useTracks = () => [];
export const AudioSession = {
  startAudioSession: () => {},
  stopAudioSession: () => {},
};
export const registerGlobals = () => {};

export default {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  AudioSession,
  registerGlobals,
};
