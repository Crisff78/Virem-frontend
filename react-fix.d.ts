import * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> { }
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react-native' {
  interface AnimatedView extends React.Component<any, any> { }
  export namespace Animated {
    export class View extends React.Component<any, any> { }
    export class Text extends React.Component<any, any> { }
    export class Image extends React.Component<any, any> { }
    export class ScrollView extends React.Component<any, any> { }
  }
}

declare module 'react';
declare module 'react-native-vector-icons/MaterialIcons';
declare module 'react-native-vector-icons/MaterialCommunityIcons';
declare module '@expo/vector-icons';
