import React from 'react';
import { View, StyleSheet } from 'react-native';

interface BodyIllustrationProps {
  type: 'low' | 'fit' | 'full' | 'high';
}

export function BodyIllustration({ type }: BodyIllustrationProps) {
  return (
    <View style={styles.torsoFrame}>
      {/* Head/Neck */}
      <View style={styles.neck} />
      
      {/* Shoulders & Torso */}
      <View
        style={[
          styles.torso,
          type === 'low' && styles.torsoLow,
          type === 'fit' && styles.torsoFit,
          type === 'full' && styles.torsoFull,
          type === 'high' && styles.torsoHigh,
        ]}>
        {/* Chest lines */}
        <View style={styles.chestRow}>
          <View style={styles.nipple} />
          <View style={styles.nipple} />
        </View>

        {/* Abs definition for 'low' fat */}
        {type === 'low' && (
          <View style={styles.absGrid}>
            <View style={styles.absRow}>
              <View style={styles.absBlock} />
              <View style={styles.absBlock} />
            </View>
            <View style={styles.absRow}>
              <View style={styles.absBlock} />
              <View style={styles.absBlock} />
            </View>
            <View style={styles.absRow}>
              <View style={styles.absBlock} />
              <View style={styles.absBlock} />
            </View>
          </View>
        )}

        {/* Navel dot for fit / full / high */}
        {type !== 'low' && <View style={styles.navel} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  torsoFrame: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  neck: {
    width: 32,
    height: 18,
    backgroundColor: '#FDE68A',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    borderColor: '#EAB308',
    marginBottom: -2,
    zIndex: 2,
  },
  torso: {
    width: 90,
    height: 110,
    backgroundColor: '#FEF08A',
    borderWidth: 2,
    borderColor: '#EAB308',
    borderRadius: 14,
    alignItems: 'center',
    paddingTop: 14,
  },
  torsoLow: {
    width: 86,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  torsoFit: {
    width: 84,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  torsoFull: {
    width: 96,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  torsoHigh: {
    width: 106,
    height: 114,
    borderRadius: 24,
    backgroundColor: '#FEF08A',
  },
  chestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 50,
    marginBottom: 8,
  },
  nipple: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CA8A04',
  },
  absGrid: {
    gap: 4,
    marginTop: 2,
  },
  absRow: {
    flexDirection: 'row',
    gap: 4,
  },
  absBlock: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#CA8A04',
    borderRadius: 3,
  },
  navel: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CA8A04',
    marginTop: 18,
  },
});
