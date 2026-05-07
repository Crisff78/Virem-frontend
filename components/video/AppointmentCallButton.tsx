import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  formatCountdown,
  useAppointmentVideoAccess,
} from '../../hooks/useAppointmentVideoAccess';

type Props = {
  citaId: string;
  /** Llamado cuando el usuario presiona y la cita esta disponible. */
  onJoin: () => void;
  /** Texto custom (default: "Entrar a videollamada"). */
  label?: string;
  compact?: boolean;
};

const colors = {
  primary: '#137fec',
  disabled: '#94a8be',
  bg: '#eef6ff',
  text: '#0a1931',
  muted: '#4a7fa7',
  danger: '#dc3545',
  success: '#22c55e',
};

const AppointmentCallButton: React.FC<Props> = ({ citaId, onJoin, label, compact }) => {
  const access = useAppointmentVideoAccess(citaId);

  const { primaryText, helperText, isAvailable, isLoading, color } = useMemo(() => {
    if (access.loading && !access.snapshot) {
      return {
        primaryText: 'Verificando...',
        helperText: '',
        isAvailable: false,
        isLoading: true,
        color: colors.muted,
      };
    }
    if (access.error) {
      return {
        primaryText: 'No disponible',
        helperText: access.error,
        isAvailable: false,
        isLoading: false,
        color: colors.danger,
      };
    }
    if (access.canJoin) {
      const remaining = access.secondsUntilClose;
      return {
        primaryText: label || 'Entrar a videollamada',
        helperText: remaining > 0 ? `Cierra en ${formatCountdown(remaining)}` : 'Disponible',
        isAvailable: true,
        isLoading: false,
        color: colors.success,
      };
    }
    if (access.snapshot?.access?.reason === 'fuera_de_horario_temprano') {
      return {
        primaryText: 'Aun no disponible',
        helperText: `Abre en ${formatCountdown(access.secondsUntilOpen)}`,
        isAvailable: false,
        isLoading: false,
        color: colors.muted,
      };
    }
    return {
      primaryText: 'No disponible',
      helperText: access.message,
      isAvailable: false,
      isLoading: false,
      color: colors.muted,
    };
  }, [access, label]);

  return (
    <TouchableOpacity
      activeOpacity={isAvailable ? 0.85 : 1}
      onPress={isAvailable ? onJoin : undefined}
      disabled={!isAvailable}
      style={[
        styles.btn,
        compact && styles.btnCompact,
        !isAvailable && styles.btnDisabled,
        isAvailable && styles.btnEnabled,
      ]}
    >
      <View style={styles.row}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <MaterialIcons
            name={isAvailable ? 'videocam' : 'schedule'}
            size={compact ? 18 : 22}
            color="#fff"
          />
        )}
        <Text style={[styles.txt, compact && styles.txtCompact]}>{primaryText}</Text>
      </View>
      {!compact && helperText ? (
        <Text style={[styles.helper, { color }]}>{helperText}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.disabled,
    gap: 4,
  },
  btnCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnEnabled: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: colors.disabled,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  txtCompact: { fontSize: 13 },
  helper: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.95,
  },
});

export default AppointmentCallButton;
