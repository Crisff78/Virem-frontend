import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  config: {
    domain: string;
    roomName: string;
    displayName: string;
    userId: string;
  };
  onEnd?: () => void;
};

const JitsiVideoContainer: React.FC<Props> = ({ config, onEnd }) => {
  const joinUrl = `https://${config.domain}/${config.roomName}`;

  const handlePress = () => {
    Linking.openURL(joinUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MaterialIcons name="video-call" size={60} color="#137fec" />
        <Text style={styles.title}>Consulta de Jitsi Meet</Text>
        <Text style={styles.subtitle}>Presiona el botón para unirte a la videollamada.</Text>
        
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>Unirse a la llamada</Text>
          <MaterialIcons name="open-in-new" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton} onPress={onEnd}>
          <Text style={styles.endButtonText}>Finalizar Consulta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1931',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0a1931',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A7FA7',
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#137fec',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 16,
    width: '100%',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  endButton: {
    marginTop: 20,
    padding: 10,
  },
  endButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default JitsiVideoContainer;
