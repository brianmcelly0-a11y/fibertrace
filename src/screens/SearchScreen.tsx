import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '../theme/colors';
import * as Search from '@/lib/advancedSearch';

const MOCK_JOBS = [
  { id: 'j1', jobId: 'JOB-001', name: 'Main Street Installation', description: 'Fiber installation from OLT to residential area', status: 'In Progress', priority: 'High', assignedTechnician: 'John Doe' },
  { id: 'j2', jobId: 'JOB-002', name: 'Downtown Splicing', description: 'Fiber splicing and testing work', status: 'Completed', priority: 'Medium', assignedTechnician: 'Jane Smith' },
  { id: 'j3', jobId: 'JOB-003', name: 'Park Avenue Route', description: 'Route installation and survey', status: 'Pending', priority: 'Low', assignedTechnician: 'Mike Johnson' },
  { id: 'j4', jobId: 'JOB-004', name: 'Airport Terminal Expansion', description: 'High-speed fiber network installation', status: 'In Progress', priority: 'Critical', assignedTechnician: 'Sarah Lee' },
  { id: 'j5', jobId: 'JOB-005', name: 'University Campus Network', description: 'Multi-building fiber connectivity', status: 'Completed', priority: 'High', assignedTechnician: 'John Doe' },
  { id: 'j6', jobId: 'JOB-006', name: 'Residential Complex', description: 'Last-mile fiber delivery', status: 'In Progress', priority: 'Medium', assignedTechnician: 'Mike Johnson' },
];

const MOCK_SAVED_SEARCHES = [
  { name: 'My Jobs', filters: [] },
  { name: 'High Priority', filters: [] },
  { name: 'In Progress', filters: [] },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Search.SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const searchQuery: Search.SearchQuery = {
        text: query,
        filters: [],
        scope: 'all',
        sortBy: 'relevance',
        limit: 20,
      };
      const searchResults = Search.executeSearch(MOCK_JOBS, searchQuery);
      setResults(searchResults);
      setShowSaved(false);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, nodes, routes..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
            <Text style={styles.searchButtonText}>{loading ? '...' : 'Go'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Stats */}
        {results.length > 0 && (
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>{results.length} result{results.length !== 1 ? 's' : ''} found</Text>
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching {MOCK_JOBS.length} records...</Text>
          </View>
        ) : !query ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Search Across All Resources</Text>
            <Text style={styles.welcomeText}>Find jobs, nodes, routes, and inventory items by ID, name, or description</Text>
            
            <Text style={styles.suggestionsTitle}>Saved Searches</Text>
            {MOCK_SAVED_SEARCHES.map((saved, idx) => (
              <TouchableOpacity key={idx} style={styles.savedSearchCard} onPress={() => setQuery(saved.name)}>
                <Text style={styles.savedSearchName}>{saved.name}</Text>
              </TouchableOpacity>
            ))}
            
            <Text style={styles.suggestionsTitle}>Popular Queries</Text>
            {['installation', 'splicing', 'airport'].map((term, idx) => (
              <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => { setQuery(term); handleSearch(); }}>
                <Text style={styles.suggestionText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateText}>Searched {MOCK_JOBS.length} jobs for "{query}"</Text>
            <TouchableOpacity style={styles.tryAgainButton} onPress={() => setQuery('')}>
              <Text style={styles.tryAgainText}>Try Different Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {results.map(result => (
              <TouchableOpacity key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={[styles.relevanceScore, { backgroundColor: result.relevance > 150 ? colors.chart.green : colors.chart.amber, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: colors.background }]}>
                    {Math.round(result.relevance / 10)}%
                  </Text>
                </View>
                <Text style={styles.resultDescription}>{result.description}</Text>
                <View style={styles.resultFooter}>
                  <Text style={[styles.resultType, { color: result.metadata.priority === 'Critical' ? colors.destructive : result.metadata.priority === 'High' ? colors.chart.amber : colors.chart.green }]}>
                    {result.metadata.priority}
                  </Text>
                  <Text style={styles.resultStatus}>{result.metadata.status}</Text>
                  <Text style={styles.resultTech}>{result.metadata.assignedTechnician}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground },
  searchButton: { backgroundColor: colors.primary, paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center' },
  searchButtonText: { fontSize: 12, fontWeight: '600', color: colors.background },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.card + '30', marginHorizontal: 12, borderRadius: 4, marginBottom: 8 },
  statsText: { fontSize: 12, color: colors.foreground, fontWeight: '600' },
  clearButton: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  welcomeContainer: { paddingHorizontal: 12, paddingVertical: 20 },
  welcomeTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  welcomeText: { fontSize: 12, color: colors.mutedForeground, marginBottom: 20 },
  suggestionsTitle: { fontSize: 12, fontWeight: '600', color: colors.foreground, marginTop: 16, marginBottom: 8 },
  savedSearchCard: { backgroundColor: colors.card, borderRadius: 6, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  savedSearchName: { fontSize: 12, fontWeight: '600', color: colors.primary },
  suggestionItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { fontSize: 12, color: colors.foreground },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 13, color: colors.mutedForeground, marginTop: 12 },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
  emptyStateText: { fontSize: 12, color: colors.mutedForeground, marginBottom: 16 },
  tryAgainButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 4 },
  tryAgainText: { fontSize: 12, fontWeight: '600', color: colors.background },
  resultsList: { paddingHorizontal: 12, paddingBottom: 20 },
  resultCard: { backgroundColor: colors.card, borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  resultTitle: { fontSize: 13, fontWeight: '600', color: colors.foreground, flex: 1 },
  relevanceScore: { fontSize: 11, fontWeight: '600', color: colors.background },
  resultDescription: { fontSize: 11, color: colors.mutedForeground, marginBottom: 8 },
  resultFooter: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  resultType: { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, backgroundColor: colors.card + '80' },
  resultStatus: { fontSize: 10, fontWeight: '600', color: colors.chart.amber },
  resultTech: { fontSize: 10, color: colors.mutedForeground, fontStyle: 'italic' },
});
