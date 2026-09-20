export interface DependencyNode {
  id: string;
  name: string;
  jobType: string;
  payload?: any;
  dependsOn?: string[]; // IDs of nodes this node depends on
}

export class DependencyService {
  /**
   * Detects cycles in a directed graph of job dependencies.
   * Returns true if a cycle is found, along with the cycle path.
   */
  public detectCycle(nodes: DependencyNode[]): { hasCycle: boolean; cyclePath?: string[] } {
    const adjList = new Map<string, string[]>();
    for (const node of nodes) {
      adjList.set(node.id, node.dependsOn || []);
    }

    const visited = new Set<string>();
    const inStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      inStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (inStack.has(neighbor)) {
          path.push(neighbor);
          return true;
        }
      }

      inStack.delete(nodeId);
      path.pop();
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) {
          return { hasCycle: true, cyclePath: [...path] };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Computes execution stages for parallel DAG execution.
   * Stage 0: nodes with no dependencies
   * Stage 1: nodes depending only on Stage 0
   * etc.
   */
  public computeExecutionStages(nodes: DependencyNode[]): DependencyNode[][] {
    const cycleCheck = this.detectCycle(nodes);
    if (cycleCheck.hasCycle) {
      throw new Error(`Ciclo de dependência detectado no grafo: ${cycleCheck.cyclePath?.join(' -> ')}`);
    }

    const nodeMap = new Map<string, DependencyNode>();
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of nodes) {
      nodeMap.set(node.id, node);
      inDegree.set(node.id, (node.dependsOn || []).length);
      dependents.set(node.id, []);
    }

    for (const node of nodes) {
      for (const depId of node.dependsOn || []) {
        dependents.get(depId)?.push(node.id);
      }
    }

    const stages: DependencyNode[][] = [];
    let currentStage = nodes.filter(n => (inDegree.get(n.id) || 0) === 0);

    while (currentStage.length > 0) {
      stages.push(currentStage);
      const nextStage: DependencyNode[] = [];

      for (const node of currentStage) {
        for (const dependentId of dependents.get(node.id) || []) {
          const newDeg = (inDegree.get(dependentId) || 1) - 1;
          inDegree.set(dependentId, newDeg);
          if (newDeg === 0) {
            const nextNode = nodeMap.get(dependentId);
            if (nextNode) nextStage.push(nextNode);
          }
        }
      }

      currentStage = nextStage;
    }

    return stages;
  }
}
