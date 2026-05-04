// Global declarations for non-TS modules
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.ico';

// We should NOT declare module 'react' or 'react-native' here 
// as it overrides the real types and can break the bundler.
