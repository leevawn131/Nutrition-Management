import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AnalysisLoadingModalProps {
  visible: boolean;
}

export const AnalysisLoadingModal: React.FC<AnalysisLoadingModalProps> = ({ visible }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (visible) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 300);
    } else {
      setProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="food-fork-drink" size={44} color="#F59E0B" />
          </View>

          <Text style={styles.percentageText}>{Math.min(99, progress)}%</Text>
          <Text style={styles.statusText}>Đang phân tích và tính toán...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  percentageText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
