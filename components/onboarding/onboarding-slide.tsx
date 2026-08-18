import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlideItem } from './slide-data';
import { SlideIllustration1 } from './slide-illustration-1';
import { SlideIllustration2 } from './slide-illustration-2';
import { SlideIllustration3 } from './slide-illustration-3';

interface OnboardingSlideProps {
  item: OnboardingSlideItem;
  width: number;
}

export function OnboardingSlide({ item, width }: OnboardingSlideProps) {
  const renderIllustration = () => {
    switch (item.illustrationType) {
      case 'recipes':
        return <SlideIllustration1 />;
      case 'ai_plan':
        return <SlideIllustration2 />;
      case 'community':
        return <SlideIllustration3 />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.slideContainer, { width }]}>
      {/* Top Graphic Illustration Area */}
      <View style={styles.illustrationWrapper}>{renderIllustration()}</View>

      {/* Title & Description Content Area */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  illustrationWrapper: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#0F2644', // Deep rich navy matching reference
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15.5,
    lineHeight: 23,
    color: '#4B5563', // Slate gray matching reference
    textAlign: 'center',
    maxWidth: 320,
  },
});
