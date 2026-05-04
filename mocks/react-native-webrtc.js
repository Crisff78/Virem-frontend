// Mock file to prevent react-native-webrtc from crashing on web
export const RTCView = () => null;
export const RTCPeerConnection = () => null;
export const RTCIceCandidate = () => null;
export const RTCSessionDescription = () => null;
export const MediaStream = () => null;
export const MediaStreamTrack = () => null;
export const mediaDevices = {
  getUserMedia: () => Promise.resolve(null),
  enumerateDevices: () => Promise.resolve([]),
};
export const registerGlobals = () => {};
export default {
  RTCView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
};
