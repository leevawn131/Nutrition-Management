import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CONTAINER_SIZE = Math.min(width * 0.78, 300);

export function SlideIllustration2() {
  return (
    <View style={styles.container}>
      {/* Background Soft Pastel Circle */}
      <View style={styles.backgroundCircle} />

      {/* Main AI Nutritionist Robot Avatar Card */}
      <View style={styles.robotWrapper}>
        {/* Chef Hat */}
        <View style={styles.hatContainer}>
          <View style={styles.hatPuffLeft} />
          <View style={styles.hatPuffCenter} />
          <View style={styles.hatPuffRight} />
          <View style={styles.hatBand} />
        </View>

        {/* Robot Head */}
        <View style={styles.headContainer}>
          {/* Earphones / Antennae */}
          <View style={styles.earLeft} />
          <View style={styles.earRight} />

          {/* Face */}
          <View style={styles.face}>
            <View style={styles.eyeRow}>
              <View style={styles.eye}>
                <View style={styles.eyePupil} />
              </View>
              <View style={styles.eye}>
                <View style={styles.eyePupil} />
              </View>
            </View>

            {/* Blush cheeks & Cute Smile */}
            <View style={styles.cheekRow}>
              <View style={styles.cheek} />
              <View style={styles.mouth} />
              <View style={styles.cheek} />
            </View>
          </View>
        </View>

        {/* Robot Body & Chef Apron */}
        <View style={styles.bodyContainer}>
          <View style={styles.apron}>
            {/* Robot Neck tie */}
            <View style={styles.neckTie} />

            {/* Nutrition Clipboard / Tablet */}
            <View style={styles.clipboard}>
              <View style={styles.clipTop} />
              <View style={styles.clipLine} />
              <View style={styles.clipRow}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={styles.clipText}>Thực đơn AI</Text>
              </View>
              <View style={styles.clipRow}>
                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                <Text style={styles.clipText}>TDEE & Calo</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Floating Badges */}
      <View style={[styles.floatingBadge, styles.badgeTopRight]}>
        <MaterialCommunityIcons name="robot-happy-outline" size={16} color="#0284C7" />
        <Text style={styles.badgeText}>AI Thông Minh</Text>
      </View>

      <View style={[styles.floatingBadge, styles.badgeBottomLeft]}>
        <FontAwesome6 name="user-doctor" size={14} color="#16A34A" />
        <Text style={styles.badgeText}>Tư vấn 1-1</Text>
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
  },
  backgroundCircle: {
    position: 'absolute',
    width: CONTAINER_SIZE * 0.78,
    height: CONTAINER_SIZE * 0.78,
    borderRadius: (CONTAINER_SIZE * 0.78) / 2,
    backgroundColor: '#E0F2FE', // Light sky blue
    opacity: 0.85,
  },
  robotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  hatContainer: {
    alignItems: 'center',
    marginBottom: -6,
    zIndex: 5,
  },
  hatPuffLeft: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    left: -12,
    top: 2,
    borderWidth: 2,
    borderColor: '#334155',
  },
  hatPuffRight: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    right: -12,
    top: 2,
    borderWidth: 2,
    borderColor: '#334155',
  },
  hatPuffCenter: {
    width: 38,
    height: 36,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#334155',
    zIndex: 6,
  },
  hatBand: {
    width: 52,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#334155',
    marginTop: -6,
    zIndex: 7,
  },
  headContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  earLeft: {
    position: 'absolute',
    left: -8,
    width: 14,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#334155',
    zIndex: 1,
  },
  earRight: {
    position: 'absolute',
    right: -8,
    width: 14,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#38BDF8',
    borderWidth: 2,
    borderColor: '#334155',
    zIndex: 1,
  },
  face: {
    width: 90,
    height: 74,
    backgroundColor: '#F0F9FF',
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingTop: 6,
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 22,
    marginBottom: 4,
  },
  eye: {
    width: 18,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePupil: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  cheekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 68,
  },
  cheek: {
    width: 10,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#FDA4AF', // Soft pink blush
  },
  mouth: {
    width: 12,
    height: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 2,
    borderColor: '#0F172A',
    borderTopWidth: 0,
  },
  bodyContainer: {
    alignItems: 'center',
    marginTop: -4,
  },
  apron: {
    width: 86,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 2.5,
    borderColor: '#334155',
    alignItems: 'center',
    paddingTop: 6,
    position: 'relative',
  },
  neckTie: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginBottom: 6,
  },
  clipboard: {
    width: 72,
    height: 52,
    backgroundColor: '#FCE7F3', // Soft pink clipboard like in reference
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#DB2777',
    padding: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  clipTop: {
    position: 'absolute',
    top: -5,
    alignSelf: 'center',
    width: 20,
    height: 5,
    backgroundColor: '#9D174D',
    borderRadius: 2,
  },
  clipLine: {
    width: '80%',
    height: 3,
    backgroundColor: '#F472B6',
    borderRadius: 1.5,
    marginBottom: 4,
    marginLeft: 2,
  },
  clipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  clipText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#831843',
  },
  floatingBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeTopRight: {
    top: 16,
    right: -4,
  },
  badgeBottomLeft: {
    bottom: 8,
    left: -4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
});
