import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { Image, Platform, ScrollView, Text, View } from "react-native";
import { useResponsive } from "./hooks/useResponsive";

import { RegistroMedicoFormCard } from "./components/registro-medico/RegistroMedicoFormCard";
import { RegistroMedicoSelectionModals } from "./components/registro-medico/RegistroMedicoSelectionModals";
import { colors, styles } from "./components/registro-medico/styles";
import { useRegistroMedicoForm } from "./hooks/useRegistroMedicoForm";
import { RootStackParamList } from "./navigation/types";

type NavigationProps = NativeStackNavigationProp<RootStackParamList, "RegistroMedico">;

const ViremLogo = require("./assets/imagenes/descarga.png");

const RegistroMedicoScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const controller = useRegistroMedicoForm(navigation);
  const { isDesktop, isTablet, isMobile, select, height: viewportHeight } = useResponsive();

  const isWideLayout = isDesktop || isTablet;
  const isTabletLayout = isTablet;

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.header}>
        <View style={[styles.headerContent, isWideLayout && styles.headerContentWide]}>
          <View style={styles.logoGroup}>
            <Image source={ViremLogo} style={styles.logoImage} />
            <View>
              <Text style={styles.logoText}>VIREM</Text>
              <Text style={styles.logoSubtitle}>Gestión Médica</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={[
          styles.mainContent,
          isWideLayout && styles.mainContentWide,
        ]}
        contentContainerStyle={styles.mainContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          <View style={styles.breadcrumbs}>
            <Text style={styles.breadcrumbLink}>Médicos</Text>
            <MaterialIcons name="chevron-right" size={16} style={styles.breadcrumbSeparator} />
            <Text style={styles.breadcrumbCurrent}>Registro de Médico</Text>
          </View>

          <View style={{ gap: 8, alignItems: "center", marginBottom: 24 }}>
            <Text style={styles.pageTitle}>Nuevo Médico</Text>
          </View>

          <RegistroMedicoFormCard
            controller={controller}
            isWideLayout={isWideLayout}
            isTabletLayout={isTabletLayout}
          />
        </View>
      </ScrollView>

      <RegistroMedicoSelectionModals controller={controller} />
    </View>
  );
};

export default RegistroMedicoScreen;
