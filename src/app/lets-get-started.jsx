// LetsGetStarted.jsx
// React Native + Expo version of the screen in your image

import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function LetsGetStarted() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.phoneFrame}>
        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop",
          }}
          style={styles.background}
          imageStyle={styles.imageStyle}
        >
          {/* Dark Overlay */}
          <View style={styles.overlay} />

          {/* Top Section */}
          <View style={styles.topRow}>
            <View style={styles.profileContainer}>
              <Image
                source={{
                  uri: "https://i.pravatar.cc/100",
                }}
                style={styles.profileImage}
              />
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.logo}>Boothflow</Text>
          </View>

          {/* Main Title */}
          <View style={styles.middleContent}>
            <Text style={styles.heading}>
              Smart lead{"\n"}capture with AI
            </Text>
          </View>

          {/* Bottom CTA */}
          <View style={styles.bottomContainer}>
            <Text style={styles.ctaText}>
              Let's Get{"\n"}Started!
            </Text>

            <TouchableOpacity style={styles.arrowButton}>
              <Ionicons name="arrow-forward" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },

  phoneFrame: {
    width: 320,
    height: 680,
    borderRadius: 35,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  background: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  imageStyle: {
    borderRadius: 35,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },

  profileContainer: {
    position: "relative",
  },

  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#fff",
  },

  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "red",
    position: "absolute",
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: "#fff",
  },

  logo: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    fontFamily: "serif",
  },

  middleContent: {
    zIndex: 2,
    marginTop: 80,
  },

  heading: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 48,
    width: "90%",
  },

  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },

  ctaText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },

  arrowButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ffb000",
    justifyContent: "center",
    alignItems: "center",
  },
});
