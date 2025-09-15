import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { opportunitiesAPI } from '../lib/api';
import { useLanguage } from './context/LanguageContext';



export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);

  // Fetch opportunities from backend
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const data = await opportunitiesAPI.getOpportunities();
        setOpportunities(data);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        setOpportunities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const filtered = opportunities.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Background gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#f0f4ff', '#e8f0ff']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      <View style={styles.container}>
        {/* Header with search bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.tint} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchOpportunities')}
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
        {/* Results */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultCard} activeOpacity={0.92}>
              <Image source={{ uri: item.image }} style={styles.resultImage} />
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultDesc}>{item.description}</Text>
                <View style={styles.resultMetaRow}>
                  <Ionicons name="location-outline" size={12} color="#999" style={{ marginRight: 4 }} />
                  <Text style={styles.resultMeta}>{item.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>{t('noResultsFound')}</Text>
              <Text style={styles.emptyMessage}>{t('tryDifferentSearch')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultMeta: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 