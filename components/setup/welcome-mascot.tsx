import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width * 0.82, 310);

export function WelcomeMascot() {
  return (
    <View style={styles.container}>
      {/* 1. Floating Apple (Top Left) */}
      <View style={styles.floatingApple}>
        <View style={styles.appleStem} />
        <View style={styles.appleBody}>
          <FontAwesome6 name="apple-whole" size={48} color="#EF4444" />
        </View>
      </View>

      {/* 2. Floating Broccoli (Top Right) */}
      <View style={styles.floatingBroccoli}>
        <MaterialCommunityIcons name="tree" size={54} color="#22C55E" />
      </View>

      {/* 3. Floating Avocado (Middle Left) */}
      <View style={styles.floatingAvocadoLeft}>
        <View style={styles.avocadoOuter}>
          <View style={styles.avocadoInner}>
            <View style={styles.avocadoPit} />
          </View>
        </View>
      </View>

      {/* 4. Floating Avocado (Middle Right) */}
      <View style={styles.floatingAvocadoRight}>
        <View style={styles.avocadoOuter}>
          <View style={styles.avocadoInner}>
            <View style={styles.avocadoPit} />
          </View>
        </View>
      </View>

      {/* 5. Floating Carrot (Bottom Right) */}
      <View style={styles.floatingCarrot}>
        <MaterialCommunityIcons name="carrot" size={52} color="#F97316" />
      </View>

      {/* 6. Sparkle Star (Left) */}
      <View style={styles.sparkleStar}>
        <Ionicons name="sparkles" size={24} color="#FBBF24" />
      </View>

      {/* 7. Main AI Chef Mascot Character */}
      <View style={styles.mascotWrapper}>
        {/* Chef Hat */}
        <View style={styles.hatContainer}>
          <View style={styles.hatPuffLeft} />
          <View style={styles.hatPuffCenter} />
          <View style={styles.hatPuffRight} />
          <View style={styles.hatBand} />
        </View>

        {/* Robot Head */}
        <View style={styles.headContainer}>
          {/* Headphones / Antennae */}
          <View style={styles.earLeft} />
          <View style={styles.earRight} />

          {/* Face */}
          <View style={styles.face}>
            <View style={styles.eyeRow}>
              <View style={styles.eye}>
                <View style={styles.pupil} />
                <View style={styles.eyeHighlight} />
              </View>
              <View style={styles.eye}>
                <View style={styles.pupil} />
                <View style={styles.eyeHighlight} />
              </View>
            </View>

            {/* Happy Open Smile */}
            <View style={styles.smile} />
          </View>
        </View>

        {/* Robot Body with Apron */}
        <View style={styles.bodyContainer}>
          {/* Apron */}
          <View style={styles.apron}>
            <Text style={styles.apronBrand}>.m</Text>
          </View>

          {/* Waving Hand (Right) */}
          <View style={styles.handRight}>
            <MaterialCommunityIcons name="hand-wave" size={32} color="#93C5FD" />
          </View>

          {/* Left Arm */}
          <View style={styles.handLeft} />
        </View>

        {/* Feet */}
        <View style={styles.feetRow}>
          <View style={styles.foot} />
          <View style={styles.foot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  floatingApple: {
    position: 'absolute',
    top: 14,
    left: 10,
    transform: [{ rotate: '-12deg' }],
  },
  appleStem: {},
  appleBody: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingBroccoli: {
    position: 'absolute',
    top: 10,
    right: 18,
    transform: [{ rotate: '15deg' }],
  },
  floatingAvocadoLeft: {
    position: 'absolute',
    left: 4,
    bottom: 40,
    transform: [{ rotate: '-25deg' }],
  },
  floatingAvocadoRight: {
    position: 'absolute',
    right: 6,
    top: 60,
    transform: [{ rotate: '20deg' }],
  },
  avocadoOuter: {
    width: 38,
    height: 52,
    borderRadius: 22,
    backgroundColor: '#3F6212', // Dark green peel
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avocadoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: '#D9F99D', // Light lime flesh
    alignItems: 'center',
    justifyContent: 'center',
  },
  avocadoPit: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#78350F', // Brown seed
  },
  floatingCarrot: {
    position: 'absolute',
    bottom: 12,
    right: 8,
    transform: [{ rotate: '18deg' }],
  },
  sparkleStar: {
    position: 'absolute',
    left: 20,
    top: 96,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
  },
  hatContainer: {
    alignItems: 'center',
    marginBottom: -8,
    zIndex: 10,
  },
  hatPuffCenter: {
    position: 'absolute',
    top: -24,
    width: 58,
    height: 48,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  hatPuffLeft: {
    position: 'absolute',
    top: -18,
    left: -20,
    width: 44,
    height: 38,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    zIndex: 1,
  },
  hatPuffRight: {
    position: 'absolute',
    top: -18,
    right: -20,
    width: 44,
    height: 38,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    zIndex: 1,
  },
  hatBand: {
    width: 76,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    zIndex: 3,
  },
  headContainer: {
    width: 106,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#BAE6FD', // Friendly sky blue robot
    borderWidth: 3,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 5,
  },
  earLeft: {
    position: 'absolute',
    left: -10,
    top: 22,
    width: 14,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#0284C7',
  },
  earRight: {
    position: 'absolute',
    right: -10,
    top: 22,
    width: 14,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#0284C7',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 4,
  },
  eye: {
    width: 22,
    height: 24,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pupil: {
    width: 12,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  eyeHighlight: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  smile: {
    width: 24,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  bodyContainer: {
    width: 90,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    position: 'relative',
    zIndex: 4,
  },
  apron: {
    width: 62,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apronBrand: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  handRight: {
    position: 'absolute',
    right: -24,
    top: 2,
  },
  handLeft: {
    position: 'absolute',
    left: -14,
    top: 14,
    width: 18,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#0284C7',
    transform: [{ rotate: '20deg' }],
  },
  feetRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: -2,
    zIndex: 1,
  },
  foot: {
    width: 24,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#0369A1',
  },
});
