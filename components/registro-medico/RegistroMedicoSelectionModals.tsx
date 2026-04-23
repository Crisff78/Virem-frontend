import React from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { RegistroMedicoFormController } from "../../hooks/useRegistroMedicoForm";
import { colors, styles } from "./styles";

type RegistroMedicoSelectionModalsProps = {
  controller: RegistroMedicoFormController;
};

export const RegistroMedicoSelectionModals: React.FC<RegistroMedicoSelectionModalsProps> = ({
  controller,
}) => {
  return (
    <>
      <Modal visible={controller.modals.showGenderModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={controller.closeGenderModal}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            {controller.genderOptions.map((gender) => (
              <TouchableOpacity
                key={gender}
                style={styles.modalOption}
                onPress={() => controller.selectGender(gender)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalOptionText}>{gender}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={controller.modals.showPrefixModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={controller.closePrefixModal}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              {controller.countryCodeOptions.map((countryCode, index) => (
                <TouchableOpacity
                  key={`${countryCode.code}-${countryCode.name}-${index}`}
                  style={styles.modalOption}
                  onPress={() => controller.selectCountryCode(countryCode)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalOptionText}>
                    {countryCode.code} ({countryCode.name})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={controller.modals.showEspModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={controller.closeEspecialidadModal}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={[styles.modalOptionText, { marginBottom: 12, fontWeight: "700" }]}>
              Selecciona especialidad
            </Text>

            <TextInput
              style={styles.inputField}
              placeholder="Buscar..."
              value={controller.values.espQuery}
              onChangeText={controller.setEspecialidadQuery}
              autoFocus
            />

            <View style={{ height: 12 }} />

            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
              {controller.especialidadesFiltradas.map((especialidad) => (
                <TouchableOpacity
                  key={especialidad}
                  style={styles.modalOption}
                  onPress={() => controller.selectEspecialidad(especialidad)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalOptionText}>{especialidad}</Text>
                </TouchableOpacity>
              ))}

              {controller.especialidadesFiltradas.length === 0 ? (
                <Text style={{ textAlign: "center", color: colors.blueGray, marginTop: 10 }}>
                  No se encontraron resultados
                </Text>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
