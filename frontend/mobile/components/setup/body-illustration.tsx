import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface BodyIllustrationProps {
  type: 'low' | 'fit' | 'full' | 'high';
  gender?: 'male' | 'female' | 'other';
}

const BODY_IMAGES = {
  male: {
    low: require('@/assets/images/body-types/male_low.png'),
    fit: require('@/assets/images/body-types/male_fit.png'),
    full: require('@/assets/images/body-types/male_full.png'),
    high: require('@/assets/images/body-types/male_high.png'),
  },
  female: {
    low: require('@/assets/images/body-types/female_low.png'),
    fit: require('@/assets/images/body-types/female_fit.png'),
    full: require('@/assets/images/body-types/female_full.png'),
    high: require('@/assets/images/body-types/female_high.png'),
  },
};

export function BodyIllustration({ type, gender = 'male' }: BodyIllustrationProps) {
  const selectedGender = gender === 'female' ? 'female' : 'male';
  const imageSource = BODY_IMAGES[selectedGender][type] || BODY_IMAGES.male[type];

  return (
    <View style={styles.torsoFrame}>
      <Image
        source={imageSource}
        style={styles.image}
        resizeMode="contain"
      />
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
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '85%',
    height: '100%',
  },
});

