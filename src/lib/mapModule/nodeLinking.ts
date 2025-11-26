// Workflow 7: NODE LINKING - Parent-child relationships and topology
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NodeLink, MapNode } from './types';

const LINKS_STORAGE_KEY = 'map_node_links';

export async function linkNodes(
  parentId: string,
  childId: string,
  fiberLineId?: string,
  linkType: 'parent-child' | 'peer' | 'splitter' = 'parent-child'
): Promise<NodeLink> {
  const link: NodeLink = {
    parentId,
    childId,
    fiberLineId,
    linkType,
    createdAt: Date.now(),
  };

  try {
    const stored = await AsyncStorage.getItem(LINKS_STORAGE_KEY);
    const links: NodeLink[] = stored ? JSON.parse(stored) : [];
    links.push(link);
    await AsyncStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch (error) {
    console.error('Error linking nodes:', error);
  }

  return link;
}

export async function unlinkNodes(parentId: string, childId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LINKS_STORAGE_KEY);
    if (stored) {
      const links: NodeLink[] = JSON.parse(stored);
      const filtered = links.filter(
        (l) => !(l.parentId === parentId && l.childId === childId)
      );
      await AsyncStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Error unlinking nodes:', error);
  }
}

export async function getNodeChildren(parentId: string): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(LINKS_STORAGE_KEY);
    if (stored) {
      const links: NodeLink[] = JSON.parse(stored);
      return links
        .filter((l) => l.parentId === parentId && l.linkType === 'parent-child')
        .map((l) => l.childId);
    }
  } catch (error) {
    console.error('Error getting node children:', error);
  }
  return [];
}

export async function getNodeParent(childId: string): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(LINKS_STORAGE_KEY);
    if (stored) {
      const links: NodeLink[] = JSON.parse(stored);
      const link = links.find((l) => l.childId === childId && l.linkType === 'parent-child');
      return link?.parentId || null;
    }
  } catch (error) {
    console.error('Error getting node parent:', error);
  }
  return null;
}

export async function buildNetworkTree(rootNodeId: string): Promise<any> {
  const tree: any = { id: rootNodeId, children: [] };

  async function buildBranch(parentId: string): Promise<any> {
    const children = await getNodeChildren(parentId);
    return {
      id: parentId,
      children: await Promise.all(children.map((childId) => buildBranch(childId))),
    };
  }

  tree.children = (await buildBranch(rootNodeId)).children;
  return tree;
}

export async function getAllLinks(): Promise<NodeLink[]> {
  try {
    const stored = await AsyncStorage.getItem(LINKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting all links:', error);
    return [];
  }
}
