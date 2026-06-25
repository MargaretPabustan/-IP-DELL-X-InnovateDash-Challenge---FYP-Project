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

const { width } = Dimensions.get("window");

export default function LetsGetStarted() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../assets/images/booth-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark Overlay */}
        <View style={styles.overlay} />

        {/* Top Row */}
        <View
          style={[
            styles.topRow,
            { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 8 : 12 },
          ]}
        >
          <Text style={styles.logo}>Boothflow</Text>
        </View>

        {/* Middle Heading */}
        <View style={styles.middleContent}>
          <Text style={styles.heading}>
            Smart lead{"\n"}capture with AI
          </Text>
        </View>

        {/* Bottom CTA */}
        <View
          style={[
            styles.bottomContainer,
            { paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
          ]}
        >
          <Text style={styles.ctaText}>{"Let's Get"}{"\n"}Started!</Text>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => router.push("/auth/login" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={28} color="#fff" />
          </TouchableOpacity>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 2,
  },
  logo: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "300",
    fontStyle: "italic",
  },
  middleContent: {
    zIndex: 2,
    flex: 1,
    justifyContent: "center",
  },
  heading: {
    color: "#fff",
    fontSize: Math.min(width * 0.11, 46),
    fontWeight: "800",
    lineHeight: Math.min(width * 0.13, 54),
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 2,
  },
  ctaText: {
    color: "#fff",
    fontSize: Math.min(width * 0.075, 30),
    fontWeight: "700",
    lineHeight: Math.min(width * 0.09, 36),
  },
  arrowButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFB000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFB000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});