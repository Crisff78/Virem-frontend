import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useMedicoModule } from '../navigation/MedicoModuleContext';
import { useResponsive } from '../hooks/useResponsive';

type MedicoHeaderProps = {
  title: string;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  hasNotifications?: boolean;
};

const colors = {
  primary: '#137fec',
  dark: '#0A1931',
  muted: '#4A7FA7',
};

const MedicoHeader: React.FC<MedicoHeaderProps> = ({
  title,
  showNotification = true,
  onNotificationPress,
  hasNotifications = false,
}) => {
  const { isSidebarOpen, toggleSidebar } = useMedicoModule();
  const { rs, fs } = useResponsive();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {!isSidebarOpen && (
          <TouchableOpacity 
            style={[styles.menuToggle, { width: rs(40), height: rs(40), borderRadius: rs(10) }]} 
            onPress={toggleSidebar}
          >
            <MaterialIcons name="menu" size={24} color={colors.dark} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { fontSize: fs(22) }]}>{title}</Text>
      </View>
      
      {showNotification && (
        <TouchableOpacity 
          style={[styles.notifBtn, { width: rs(44), height: rs(44), borderRadius: rs(14) }]} 
          onPress={onNotificationPress}
        >
          <MaterialIcons name="notifications-none" size={24} color={colors.dark} />
          {hasNotifications && <View style={[styles.notifDot, { width: rs(10), height: rs(10), borderRadius: rs(10), top: rs(10), right: rs(10) }]} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MedicoHeader;

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16,
    paddingVertical: 4,
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    flex: 1,
  },
  menuToggle: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff', 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    elevation: 3,
  },
  title: { 
    fontWeight: '900', 
    color: colors.dark, 
    letterSpacing: -0.5,
  },
  notifBtn: { 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: colors.dark, 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 3,
  },
  notifDot: { 
    position: 'absolute', 
    backgroundColor: '#ef4444', 
    borderWidth: 2, 
    borderColor: '#fff',
    zIndex: 1,
  },
});
