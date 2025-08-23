import * as Y from "yjs";
import { RadixPriorityQueueBuilder } from "./radixpq";
import type { YMap } from "./yjsFixes";

// Adapted from y-sweet examples:
// https://github.com/jamsocket/y-sweet/blob/main/examples/nextjs/src/app/(demos)/tree-crdt/ytree.ts

const ROOT_ID = "__root";
const PARENT_KEY = "parent";

type NodeRelations = { parent: string | null; children: Set<string> };

type JsonNode = {
    parent: {
        [key: string]: number;
    };
    [key: string]: any;
};

type JsonMap = {
    [key: string]: JsonNode;
};

export type TreeJsonStructure<T extends object> = {
    id: string;
    value: T;
    children: TreeJsonStructure<T>[]
};

export class YTree<T extends object> {
    /**
     * A map from parent id to child node IDs. The root node has a null parent id.
     */
    public structure: Map<string, NodeRelations> = new Map();
    /**
     * The highest clock value seen in the PARENT_KEY maps.
     */
    public maxClock: number = 0;
    /**
     * A callback that is invoked whenever the tree structure changes.
     */
    private onChange?: () => void = () => { };
    /**
     * The underlying YMap that stores the tree data.
     * This is a map from node ID to a YMap with the following keys:
     * - parent: YMap<string, number> - a map from parent ID to clock value
     * - value: any - the value of the node
     */
    public map: YMap<YMap<any>>;

    constructor(map: YMap<YMap<any>>) {
        this.map = map as YMap<YMap<any>>;
        this.map.observeDeep((e, t) => {
            this.updateChildren();
        });
        this.updateChildren();
    }

    /**
     * Convert the tree to a JSON structure.  
     * The JSON structure should never be directly edited; all edits should be done through the YTree API.
     */
    public toJsonStructure(): TreeJsonStructure<T>[] {
        return this.root().toJsonStructure().children;
    }

    /**
     * Set a callback that is invoked whenever the tree structure changes.
     */
    public setOnChange(onChange?: () => void) {
        this.onChange = onChange;
    }

    /**
     * Get the root node of the tree.
     */
    public root(): YTreeNode<T> {
        return new YTreeNode(ROOT_ID, this);
    }

    /**
     * Get a node by its ID.
     */
    public getNode(id: string | undefined): YTreeNode<T> | null {
        if(!id) return null;
        if(!this.structure.has(id)) return null;
        return new YTreeNode(id, this);
    }

    /**
     * Rebuild the tree structure from the underlying YMap.
     */
    private updateChildren() {
        let map = this.map.toJSON();

        let [structure, maxClock] = YTree.buildTree(map);
        this.maxClock = maxClock;

        this.structure = structure;
        if(this.onChange) {
            this.onChange();
        }
    }

    /**
     * Build a tree structure from a JSON representation of the YMap.
     * @returns 
     */
    private static buildTree(map: JsonMap): [Map<string, NodeRelations>, number] {
        let maxClock = 0;

        // First, create a map of all nodes to the potential children that have them as a top-priority parent.
        let unrootedNodes = new Map<string, Set<string>>();

        /**
         * Find the parent with the highest priority in a map of parents to priorities.
         */
        function highestPriorityParent(
            map: Record<string, number>
        ): [string | null, number] {
            let maxPriority = 0;
            let maxParent = null;
            Object.entries(map).forEach(([parent, priority]) => {
                if (priority > maxPriority) {
                    maxPriority = priority;
                    maxParent = parent;
                }
            });
            return [maxParent, maxPriority];
        }

        Object.entries(map).forEach(([id, node]) => {
            let [parent, priority] = highestPriorityParent(node[PARENT_KEY]);
            if(!parent) {
                console.warn(`Ignoring node ${id} which has no parent.`, node);
                return;
            }
            if(!unrootedNodes.has(parent)) {
                unrootedNodes.set(parent, new Set<string>());
            }
            unrootedNodes.get(parent)!.add(id);
            maxClock = Math.max(maxClock, priority);
        });

        // Then, recurse from the root and build the tree.
        let rootedNodes = new Map<string, NodeRelations>();

        function recursivelyParent(id: string) {
            let children = unrootedNodes.get(id);
            if(!children) return; // Node has been parented

            for(let child of children) {
                if(rootedNodes.has(child)) continue;
                rootedNodes.set(child, { parent: id, children: new Set<string>() });
                rootedNodes.get(id)!.children.add(child);
                recursivelyParent(child);
            }

            unrootedNodes.delete(id);
        }

        rootedNodes.set(ROOT_ID, { parent: null, children: new Set<string>() });
        recursivelyParent(ROOT_ID);

        // Now, parent the remaining nodes by breaking ties.
        let queueBuilder = new RadixPriorityQueueBuilder<[string, string]>(); // [child, parent]

        unrootedNodes.forEach((_, nodeId) => {
            let node = map[nodeId]!;
            let parents: Record<string, number> = node[PARENT_KEY];
            for(let [parent, priority] of Object.entries(parents)) {
                queueBuilder.addEntry(priority, [nodeId, parent]);
            }
        });

        let nodeQueue = queueBuilder.build();

        for(let [child, parent] of nodeQueue) {
            if(rootedNodes.has(parent) && !rootedNodes.has(child)) {
                // node's parent has been parented, but node hasn't
                rootedNodes.get(parent)!.children.add(child);
                rootedNodes.set(child, { parent: parent, children: new Set<string>() });
                recursivelyParent(child);
            }
        }

        if(unrootedNodes.size > 0) {
            console.warn("Some nodes left unrooted!", unrootedNodes);
        }

        return [rootedNodes, maxClock];
    }
}

export class YTreeNode<T extends object> {
    constructor(private _id: string, public tree: YTree<T>) { }

    /**
     * Convert the node to a JSON structure.  
     * The JSON structure should never be directly edited; all edits should be done through the YTree API.
     */
    public toJsonStructure(): TreeJsonStructure<T> {
        return {
            id: this._id,
            value: Object.fromEntries(
                Array.from(this.tree.map.get(this._id)?.entries() ?? [])
                    .filter(([key]) => key !== PARENT_KEY)
            ) as T,
            children: this.children().sort((a, b) => {
                return a.id().localeCompare(b.id());
            }).map(child => child.toJsonStructure())
        };
    }

    /**
     * Get the ID of the node.
     */
    public id(): string {
        return this._id;
    }

    /**
     * Get the a specific value on this node.
     */
    public get<K extends keyof T & string>(key: K): T[K] | undefined {
        return this.tree.map.get(this._id)!.get(key);
    }

    /**
     * Set a value on this node.
     */
    public set<K extends keyof T & string>(key: K, value: T[K]) {
        this.tree.map.get(this._id)!.set(key, value);
    }

    /**
     * Get the underlying map for this node.  
     * Note that this map has internal state used to manage the tree structure.
     */
    public get map(): YMap<any> {
        return this.tree.map.get(this._id)!;
    }

    /**
     * Get the children of the node.
     */
    public children(): YTreeNode<T>[] {
        return Array.from(this.tree.structure.get(this._id)?.children ?? []).map(
            (id) => new YTreeNode(id, this.tree)
        );
    }

    /**
     * Add a child node with the given value to this node.
     */
    addChild(id: string, values: Partial<T> = {}): YTreeNode<T> {
        let nodeDataMap = new Y.Map<any>() as YMap<any>;

        let parentMap = new Y.Map();
        parentMap.set(this._id, ++this.tree.maxClock);
        nodeDataMap.set(PARENT_KEY, parentMap);
        Object.entries(values).forEach(([key, value]) => {
            nodeDataMap.set(key, value);
        });

        this.tree.map.set(id, nodeDataMap);
        return new YTreeNode(id, this.tree);
    }

    /**
     * Reparent this node to be a child of the given new parent node.
     */
    reparent(newParent: YTreeNode<T>) {
        if(this._id === ROOT_ID) {
            console.error("Can't reparent root.");
            return;
        }

        // @ts-ignore yes doc exists
        this.tree.map.doc!.transact(() => {
            let oldParent = this.tree.structure.get(this._id)!.parent!;

            if(newParent.id() === this._id) {
                return;
            }

            // Detect if the new parent was a descendant of the new child.
            let probe = newParent.id();
            while(probe !== ROOT_ID) {
                let probeParent = this.tree.structure.get(probe)!.parent!;
                if(probeParent === this._id) {
                    // If the new parent was a descendant of the new child, the old node has a
                    // child node (probe) which is an ancestor of the new parent. We promote that child
                    // to the parent's place by reparenting it to the original parent's parent.
                    this.tree.map
                        .get(probe)!
                        .get(PARENT_KEY)
                        .set(oldParent, ++this.tree.maxClock);
                    break;
                }
                probe = probeParent;
            }

            this.tree.map
                .get(this._id)!
                .get(PARENT_KEY)
                .set(newParent.id(), ++this.tree.maxClock);
        });
    }
}
