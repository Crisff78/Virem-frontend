const fs = require("fs");
let code = fs.readFileSync("LandingScreen.tsx", "utf8");

// Add useRef and Alert to imports
code = code.replace("ImageBackground } from 'react-native';", "ImageBackground, Alert } from 'react-native';");
code = code.replace("import React from 'react';", "import React, { useRef, useState } from 'react';");

// Add State and refs inside component
const refCode = `  const navigation = useNavigation<Nav>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [layoutY, setLayoutY] = useState({ plataforma: 0, especialidades: 0, contacto: 0 });

  const scrollTo = (y: number) => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  };`;

code = code.replace("  const navigation = useNavigation<Nav>();", refCode);

// Replace nav links with TouchableOpacity
const navLinks = `          <View style={styles.navLinksCenter}>
            <TouchableOpacity onPress={() => scrollTo(layoutY.especialidades)}>
              <Text style={styles.navLinkCenterText}>Especialidades</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.plataforma)}>
              <Text style={styles.navLinkCenterText}>Plataforma</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Próximamente", "Nuestro blog médico estará disponible pronto.")}>
              <Text style={styles.navLinkCenterText}>Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Próximamente", "Página de Nosotros en construcción.")}>
              <Text style={styles.navLinkCenterText}>Nosotros</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollTo(layoutY.contacto)}>
              <Text style={styles.navLinkCenterText}>Contacto</Text>
            </TouchableOpacity>
          </View>`;

code = code.replace(/<View style=\{styles\.navLinksCenter\}>[\s\S]*?<\/View>/, navLinks);

// Add ScrollView ref
code = code.replace("<ScrollView contentContainerStyle={styles.scrollContent}>", "<ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent}>");

// Add onLayout to sections
code = code.replace(
  "<View style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>", 
  "<View onLayout={(e) => setLayoutY(prev => ({...prev, plataforma: e.nativeEvent.layout.y}))} style={[styles.howItWorksSection, isDesktop && styles.howItWorksDesktop]}>"
);

code = code.replace(
  "<View style={styles.servicesSection}>", 
  "<View onLayout={(e) => setLayoutY(prev => ({...prev, especialidades: e.nativeEvent.layout.y}))} style={styles.servicesSection}>"
);

code = code.replace(
  "<View style={styles.footerContainer}>", 
  "<View onLayout={(e) => setLayoutY(prev => ({...prev, contacto: e.nativeEvent.layout.y}))} style={styles.footerContainer}>"
);

fs.writeFileSync("LandingScreen.tsx", code);
console.log("Updated LandingScreen.tsx");

