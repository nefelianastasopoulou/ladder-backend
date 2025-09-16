import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface OpportunityCardProps {
  opportunity: any;
  onPress: (opportunity: any) => void;
  onToggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  t: (key: string) => string;
}

const OpportunityCard = memo<OpportunityCardProps>(({
  opportunity,
  onPress,
  onToggleFavorite,
  isFavorite,
  t,
}) => {
  const handleToggleFavorite = () => {
    onToggleFavorite(opportunity.id);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(opportunity)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {opportunity.title}
          </Text>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite(opportunity.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(opportunity.id) ? '#ff6b6b' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {opportunity.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.metaInfo}>
            <Ionicons name="location-outline" size={16} color="#fff" />
            <Text style={styles.metaText}>{opportunity.location}</Text>
          </View>
          
          <View style={styles.metaInfo}>
            <Ionicons name="time-outline" size={16} color="#fff" />
            <Text style={styles.metaText}>{opportunity.field}</Text>
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{opportunity.category}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

OpportunityCard.displayName = 'OpportunityCard';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  gradient: {
    padding: 20,
    borderRadius: 16,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#f0f0f0',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  category: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default OpportunityCard;
