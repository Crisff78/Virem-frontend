import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  RegistroMedicoDocumentField,
  RegistroMedicoFormController,
} from "../../hooks/useRegistroMedicoForm";
import { colors, styles } from "./styles";

type RegistroMedicoFormCardProps = {
  controller: RegistroMedicoFormController;
  isWideLayout: boolean;
  isTabletLayout: boolean;
};

type DocumentoFieldProps = {
  label: string;
  field: RegistroMedicoDocumentField;
  value: string;
  showError: boolean;
  errorText: string;
  onPick: (field: RegistroMedicoDocumentField) => Promise<void>;
};



export const RegistroMedicoFormCard: React.FC<RegistroMedicoFormCardProps> = ({
  controller,
  isWideLayout,
  isTabletLayout,
}) => {
  const { values, errors } = controller;

  return (
    <View style={[styles.formCard, isWideLayout && styles.formCardWide]}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Información del Médico</Text>
        <Text style={styles.progressPercent}>{controller.progressPercent}% Completado</Text>
      </View>

      <View style={styles.progressBarOuter}>
        <View
          style={[
            styles.progressBarInner,
            {
              width: `${controller.progressPercent}%`,
            } as any,
          ]}
        />
      </View>

      <View style={styles.photoWrap}>
        <View style={styles.photoCircle}>
          {values.fotoUri ? (
            <Image source={{ uri: values.fotoUri }} style={styles.photoImg} />
          ) : (
            <MaterialIcons name="account-circle" size={78} color={colors.blueGray} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.photoBtn, errors.showErrors && !values.fotoUri && styles.inputError]}
          onPress={() => {
            void controller.pickImage();
          }}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add-a-photo" size={18} color={colors.blueGray} />
          <Text style={styles.photoBtnText}>{values.fotoUri ? "Cambiar foto" : "Subir foto"}</Text>
        </TouchableOpacity>

        {(errors.showErrors && !values.fotoUri) || errors.fotoError ? (
          <Text style={styles.errorText}>Debe ser una foto de una persona (rostro visible).</Text>
        ) : null}
      </View>

      <View style={{ gap: 24 }}>
        <View style={[styles.formRow, isWideLayout && styles.formRowWide]}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nombre completo</Text>
            <TextInput
              style={[
                styles.inputField,
                (errors.showErrors && !values.nombreCompleto) || errors.exequaturError
                  ? styles.inputError
                  : null,
              ]}
              placeholder="Ej. Juan Alberto Pérez"
              value={values.nombreCompleto}
              onChangeText={controller.setNombreCompleto}
            />
            {!!errors.exequaturError && <Text style={styles.errorText}>{errors.exequaturError}</Text>}
          </View>
        </View>

        <View style={[styles.formRow, isWideLayout && styles.formRowWide]}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Cédula (Identificación)</Text>
            <TextInput
              style={[
                styles.inputField,
                ((errors.showErrors && !values.cedula) || errors.cedulaError) && styles.inputError,
              ]}
              placeholder="XXX-XXXXXXX-X"
              keyboardType="numeric"
              value={values.cedula}
              onChangeText={controller.setCedula}
              maxLength={13}
            />
            {errors.cedulaError ? <Text style={styles.errorText}>Cédula no válida</Text> : null}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Género</Text>
            <TouchableOpacity
              style={[styles.selectInput, errors.showErrors && !values.gender && styles.inputError]}
              onPress={controller.openGenderModal}
              activeOpacity={0.85}
            >
              <Text style={{ color: values.gender ? colors.navyDark : colors.blueGray }}>
                {values.gender || "Seleccionar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formRow, isWideLayout && styles.formRowWide]}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <View style={[styles.phoneInputGroup, errors.showErrors && !values.phone && styles.inputError]}>
              <TouchableOpacity
                style={[styles.prefixButton, isWideLayout && styles.prefixButtonWide]}
                onPress={controller.openPrefixModal}
              >
                <Text style={styles.prefixText}>{values.selectedCountryCode.code}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.numberInput}
                placeholder={values.selectedCountryCode.mask}
                keyboardType="phone-pad"
                value={values.phone}
                maxLength={values.selectedCountryCode.mask.length}
                onChangeText={controller.setPhone}
              />
            </View>
            {!!errors.telefonoError && <Text style={styles.errorText}>{errors.telefonoError}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <TextInput
              style={[
                styles.inputField,
                ((errors.showErrors && !values.birthDate) ||
                  errors.fechaError ||
                  errors.fechaMayor18Error) &&
                  styles.inputError,
              ]}
              placeholder="DD/MM/YYYY"
              value={values.birthDate}
              onChangeText={controller.setBirthDate}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.fechaError ? <Text style={styles.errorText}>Fecha inexistente o futura</Text> : null}
            {errors.fechaMayor18Error ? (
              <Text style={styles.errorText}>Debe ser mayor de 18 años</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.formRow, isWideLayout && styles.formRowWide]}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Especialidad</Text>
            <TouchableOpacity
              style={[
                styles.selectInput,
                ((errors.showErrors && !values.especialidad) || errors.especialidadError) &&
                  styles.inputError,
              ]}
              onPress={controller.openEspecialidadModal}
              activeOpacity={0.85}
            >
              <Text style={{ color: values.especialidad ? colors.navyDark : colors.blueGray }}>
                {values.especialidad || "Seleccionar"}
              </Text>
            </TouchableOpacity>

            {((errors.showErrors && !values.especialidad) || errors.especialidadError) && (
              <Text style={styles.errorText}>Debe seleccionar una especialidad</Text>
            )}
          </View>


        </View>
      </View>

      <View style={[styles.footerActions, isTabletLayout && styles.footerActionsWide]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            isTabletLayout && styles.continueButtonWide,
            { backgroundColor: "transparent" },
          ]}
          onPress={controller.handleCancel}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            isTabletLayout && styles.continueButtonWide,
            { backgroundColor: controller.isFormComplete ? colors.primary : colors.disabled },
          ]}
          onPress={() => {
            void controller.handleContinue();
          }}
          disabled={controller.isLoading}
          activeOpacity={0.85}
        >
          {controller.isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "bold" }}>Guardar y Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
