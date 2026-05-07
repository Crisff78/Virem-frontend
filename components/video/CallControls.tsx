import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onFlipCamera: () => void;
  onEnd: () => void;
  durationLabel?: string;
};

const CallControls: React.FC<Props> = ({
  micEnabled,
  cameraEnabled,
  onToggleMic,
  onToggleCamera,
  onFlipCamera,
  onEnd,
  durationLabel,
}) => {
  return (
    <View style={styles.wrap}>
      {durationLabel ? <Text style={styles.duration}>{durationLabel}</Text> : null}
      <View style={styles.row}>
        <ControlButton
          active={micEnabled}
          activeIcon="mic"
          inactiveIcon="mic-off"
          onPress={onToggleMic}
          label={micEnabled ? 'Mic' : 'Mute'}
        />
        <ControlButton
          active={cameraEnabled}
          activeIcon="videocam"
          inactiveIcon="videocam-off"
          onPress={onToggleCamera}
          label={cameraEnabled ? 'Camara' : 'Camara off'}
        />
        <ControlButton
          active
          activeIcon="cameraswitch"
          inactiveIcon="cameraswitch"
          onPress={onFlipCamera}
          label="Voltear"
        />
        <TouchableOpacity onPress={onEnd} style={[styles.btn, styles.endBtn]}>
          <MaterialIcons name="call-end" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

type CtrlProps = {
  active: boolean;
  activeIcon: string;
  inactiveIcon: string;
  onPress: () => void;
  label: string;
};

const ControlButton: React.FC<CtrlProps> = ({ active, activeIcon, inactiveIcon, onPress, label }) => (
  <TouchableOpacity onPress={onPress} style={[styles.btn, !active && styles.btnInactive]}>
    <MaterialIcons name={(active ? activeIcon : inactiveIcon) as any} size={22} color="#fff" />
    <Text style={styles.btnLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: 'rgba(10,25,49,0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    gap: 10,
  },
  duration: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  btnInactive: {
    backgroundColor: 'rgba(220,53,69,0.85)',
  },
  endBtn: {
    backgroundColor: '#dc3545',
    shadowColor: '#dc3545',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  btnLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default CallControls;
