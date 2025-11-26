import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { colors } from '../theme/colors';
import * as NodeManagement from '../lib/nodeManagement';

type Node = ReturnType<typeof NodeManagement.createNode>;

export function NodeManagementScreen() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nodeType: 'FAT' as const,
    label: '',
    condition: 'new' as const,
  });

  const loadNodes = async () => {
    try {
      const loadedNodes = await NodeManagement.loadNodeDatabase();
      setNodes(loadedNodes);
    } catch (error) {
      console.error('Failed to load nodes:', error);
      Alert.alert('Error', 'Failed to load nodes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNodes();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNodes();
    setRefreshing(false);
  };

  const handleCreateNode = async () => {
    if (!formData.label.trim()) {
      Alert.alert('Error', 'Please enter a node label');
      return;
    }

    try {
      const newNode = NodeManagement.createNode(
        {
          type: formData.nodeType,
          label: formData.label,
          condition: formData.condition,
          coordinates: {
            latitude: 37.78825,
            longitude: -122.4324,
          },
        }
      );

      setNodes([...nodes, newNode]);
      setFormData({ nodeType: 'FAT', label: '', condition: 'new' });
      setShowModal(false);
      Alert.alert('Success', `Node ${newNode.nodeId} created`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create node');
    }
  };

  const handleUpdateCondition = async (node: Node, newCondition: any) => {
    try {
      const updated = NodeManagement.updateNodeCondition(node, newCondition);
      setNodes(nodes.map(n => (n.id === node.id ? updated : n)));
      setSelectedNode(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update condition');
    }
  };

  const getNodeTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      OLT: colors.chart.green,
      Splitter: colors.primary,
      FAT: colors.chart.amber,
      ATB: colors.accent,
      Closure: colors.chart.purple,
    };
    return colorMap[type] || colors.primary;
  };

  const NodeCard = ({ node }: { node: Node }) => (
    <TouchableOpacity
      style={[styles.nodeCard, { borderLeftColor: getNodeTypeColor(node.type) }]}
      onPress={() => {
        setSelectedNode(node);
        setShowModal(true);
      }}
    >
      <View style={styles.nodeHeader}>
        <Text style={styles.nodeId}>{node.id}</Text>
        <View
          style={[
            styles.conditionBadge,
            {
              backgroundColor:
                node.condition === 'new'
                  ? colors.chart.green
                  : node.condition === 'damaged'
                    ? colors.destructive
                    : colors.chart.amber,
            },
          ]}
        >
          <Text style={styles.conditionText}>{node.condition}</Text>
        </View>
      </View>
      <Text style={styles.nodeLabel}>{node.label}</Text>
      <Text style={styles.nodeType}>{node.type}</Text>
      {node.powerReadings && node.powerReadings.length > 0 && (
        <View style={styles.powerRow}>
          <Text style={styles.powerLabel}>Power:</Text>
          <Text style={[styles.powerValue, { color: node.powerIn && node.powerIn < -5 ? colors.destructive : colors.chart.green }]}>
            {node.powerIn || 'N/A'} dBm
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const stats = NodeManagement.getNodeStats(nodes);

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <StatBubble label="Total" value={stats.totalNodes} color={colors.primary} />
        <StatBubble label="Ready" value={stats.totalNodes - (stats.unsyncedCount || 0)} color={colors.chart.green} />
        <StatBubble label="Faults" value={stats.totalNodes - stats.totalNodes} color={colors.destructive} />
        <StatBubble label="Unsync" value={stats.unsyncedCount} color={colors.chart.amber} />
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setSelectedNode(null);
          setFormData({ nodeType: 'FAT', label: '', condition: 'new' });
          setShowModal(true);
        }}
      >
        <Text style={styles.createButtonText}>+ Create Node</Text>
      </TouchableOpacity>

      {/* Nodes List */}
      {loading ? (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading nodes...</Text>
        </View>
      ) : nodes.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No nodes yet</Text>
          <Text style={styles.emptySubtext}>Create a node to get started</Text>
        </View>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <NodeCard node={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitle}>
                {selectedNode ? 'Edit Node' : 'Create Node'}
              </Text>

              {/* Node Type */}
              <Text style={styles.label}>Node Type</Text>
              <View style={styles.typeGrid}>
                {['OLT', 'Splitter 1:2', 'Splitter 1:4', 'FAT', 'ATB', 'Closure'].map(
                  type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.nodeType === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, nodeType: type as any })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.nodeType === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Label */}
              <Text style={styles.label}>Label</Text>
              <TextInput
                style={styles.input}
                placeholder="Node label (e.g., Downtown OLT)"
                placeholderTextColor={colors.mutedForeground}
                value={formData.label}
                onChangeText={text => setFormData({ ...formData, label: text })}
              />

              {/* Condition */}
              <Text style={styles.label}>Condition</Text>
              <View style={styles.conditionGrid}>
                {['new', 'good', 'degraded', 'faulty'].map(condition => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.conditionButton,
                      formData.condition === condition && styles.conditionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, condition: condition as any })}
                  >
                    <Text
                      style={[
                        styles.conditionButtonText,
                        formData.condition === condition && styles.conditionButtonTextActive,
                      ]}
                    >
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected Node Details */}
              {selectedNode && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsTitle}>Node Details</Text>
                  <DetailRow label="ID" value={selectedNode.nodeId} />
                  <DetailRow
                    label="Power"
                    value={`${selectedNode.power || 'N/A'} dBm`}
                  />
                  <DetailRow label="Created" value={new Date(selectedNode.createdAt).toLocaleDateString()} />
                  <DetailRow label="Unsync" value={selectedNode.synced ? 'No' : 'Yes'} />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateNode}
                >
                  <Text style={styles.submitButtonText}>
                    {selectedNode ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBubble({ label, value, color }: any) {
  return (
    <View style={[styles.statBubble, { borderColor: color }]}>
      <Text style={styles.statBubbleValue}>{value}</Text>
      <Text style={styles.statBubbleLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: any) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBubble: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 60,
  },
  statBubbleValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  statBubbleLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  createButton: {
    margin: 12,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  nodeCard: {
    backgroundColor: colors.card,
    borderRadius: 6,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 12,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nodeId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  nodeLabel: {
    fontSize: 13,
    color: colors.foreground,
    marginBottom: 2,
  },
  nodeType: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  powerRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  powerLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginRight: 4,
  },
  powerValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  emptyText: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
  },
  modalScroll: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
    marginTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    color: colors.foreground,
    marginBottom: 12,
  },
  conditionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  conditionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conditionButtonText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  conditionButtonTextActive: {
    color: 'white',
  },
  detailsBox: {
    backgroundColor: colors.card,
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontSize: 12,
    color: colors.foreground,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
