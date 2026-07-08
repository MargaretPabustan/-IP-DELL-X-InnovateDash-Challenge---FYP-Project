import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function LetsGetStarted() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/booth-bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Layered overlays to simulate gradient */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />
        <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
        <View style={{ position: 'absolute', top: '65%', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />

        {/* TOP — Logo + tagline */}
        <View style={[styles.topRow, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 16 : 20 }]}>
          <View>
            <Text style={styles.logo}>Boothflow<Text style={styles.logoDot}>.</Text></Text>
            <Text style={styles.logoTagline}>for Dell Technologies</Text>
          </View>
        </View>

        {/* MIDDLE — Heading */}
        <View style={styles.middleContent}>
          <Text style={styles.eyebrow}>AI-POWERED LEAD CAPTURE</Text>
          <Text style={styles.heading}>Smart leads,{"\n"}smarter follow-ups.</Text>
          <Text style={styles.subheading}>Capture, analyse and act on leads{"\n"}in real time at your event.</Text>
        </View>

        {/* BOTTOM — CTA */}
        <View style={[styles.bottomContainer, { paddingBottom: Platform.OS === 'ios' ? 48 : 36 }]}>
          <View style={styles.divider} />
          <View style={styles.ctaRow}>
            <View>
              <Text style={styles.ctaLabel}>READY TO START?</Text>
              <Text style={styles.ctaText}>Let's Get{"\n"}Started</Text>
            </View>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => router.push("/auth/login" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  topRow: {
    zIndex: 2,
  },
  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  logoDot: {
    color: "#007DB8",
    fontSize: 26,
    fontWeight: "900",
  },
  logoTagline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  middleContent: {
    zIndex: 2,
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  eyebrow: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
  heading: {
    color: "#fff",
    fontSize: Math.min(width * 0.11, 44),
    fontWeight: "800",
    lineHeight: Math.min(width * 0.13, 52),
    letterSpacing: -0.5,
  },
  subheading: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
    marginTop: 4,
  },
  bottomContainer: {
    zIndex: 2,
    gap: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  ctaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  ctaLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },
  ctaText: {
    color: "#fff",
    fontSize: Math.min(width * 0.075, 30),
    fontWeight: "700",
    lineHeight: Math.min(width * 0.09, 36),
  },
  arrowButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007DB8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007DB8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});