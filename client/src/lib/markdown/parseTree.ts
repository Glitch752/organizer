import type { SyntaxNode } from "@lezer/common";
import type { Language } from "@codemirror/language";

export type ParseTree = {
    /** If undefined, this is a text node. */
    type?: string;
    from?: number;
    to?: number;
    text?: string;
    children?: ParseTree[];
    /** Only present after running addParentPointers. */
    parent?: ParseTree;
};

export function lezerToParseTree(
    text: string,
    n: SyntaxNode,
    offset = 0,
): ParseTree {
    let children: ParseTree[] = [];
    let nodeText: string | undefined;
    let child = n.firstChild;
    while(child) {
        children.push(lezerToParseTree(text, child));
        child = child.nextSibling;
    }
    
    if(children.length === 0) {
        children = [
            {
                from: n.from + offset,
                to: n.to + offset,
                text: text.substring(n.from, n.to),
            },
        ];
    } else {
        const newChildren: ParseTree[] = [];
        let index = n.from;
        for (const child of children) {
            const s = text.substring(index, child.from);
            if (s) {
                newChildren.push({
                    from: index + offset,
                    to: child.from! + offset,
                    text: s,
                });
            }
            newChildren.push(child);
            index = child.to!;
        }
        const s = text.substring(index, n.to);
        if (s) {
            newChildren.push({ from: index + offset, to: n.to + offset, text: s });
        }
        children = newChildren;
    }
    
    const result: ParseTree = {
        type: n.name,
        from: n.from + offset,
        to: n.to + offset,
    };
    if(children.length > 0) result.children = children;
    if (nodeText) result.text = nodeText;
    return result;
}

export function parse(language: Language, text: string): ParseTree {
    // Remove \r for Windows before parsing
    text = text.replaceAll("\r", "");
    const tree = lezerToParseTree(text, language.parser.parse(text).topNode);
    return tree;
}


export function traverseTree(
    tree: ParseTree,
    // Return value = should stop traversal?
    matchFn: (tree: ParseTree) => boolean,
): void {
    // Collect, but ignore the result
    collectNodesMatching(tree, matchFn);
}

export function addParentPointers(tree: ParseTree) {
    if(!tree.children) {
        return;
    }
    for(const child of tree.children) {
        if(child.parent) {
            // Already added parent pointers before
            return;
        }
        child.parent = tree;
        addParentPointers(child);
    }
}

export function removeParentPointers(tree: ParseTree) {
    delete tree.parent;
    if(!tree.children) return;
    
    for (const child of tree.children) {
        removeParentPointers(child);
    }
}

export function collectNodesOfType(
    tree: ParseTree,
    nodeType: string,
): ParseTree[] {
    return collectNodesMatching(tree, (n) => n.type === nodeType);
}


export function findNodeOfType(
    tree: ParseTree,
    nodeType: string,
): ParseTree | null {
    return collectNodesMatching(tree, (n) => n.type === nodeType)[0];
}

export function collectNodesMatching(
    tree: ParseTree,
    matchFn: (tree: ParseTree) => boolean,
): ParseTree[] {
    if(matchFn(tree)) return [tree];

    let results: ParseTree[] = [];
    if(tree.children) {
        for (const child of tree.children) {
            results = [...results, ...collectNodesMatching(child, matchFn)];
        }
    }
    return results;
}