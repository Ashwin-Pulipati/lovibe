import { TreeItem } from "@/types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges multiple class name values into a single string, resolving Tailwind CSS class conflicts.
 *
 * Accepts conditional, array, or object-based class names and ensures the resulting string is optimized for Tailwind CSS.
 *
 * @returns The merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a flat record of file paths to a nested tree structure for use in a TreeView component.
 *
 * Each file path is split into directories and file names, producing a nested array format where folders are arrays containing their name and children, and files are represented as strings.
 *
 * @param files - An object mapping file paths to their contents
 * @returns An array representing the nested tree structure of files and folders
 *
 * @example
 * Input: { "src/Button.tsx": "...", "README.md": "..." }
 * Output: [["src", "Button.tsx"], "README.md"]
 */
export function convertFilesToTreeItems(
  files: Record<string, string>
): TreeItem[] {
  interface TreeNode {
    [key: string]: TreeNode | null;
  }
 
  const tree: TreeNode = {};

  const sortedPaths = Object.keys(files).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split("/");
    let current = tree;
   
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const fileName = parts[parts.length - 1];
    current[fileName] = null;
  }
  
  /**
   * Recursively converts a nested TreeNode structure into a TreeItem array or string.
   *
   * If the node is a file (empty object), returns its name or an empty string. For folders, returns an array where the first element is the folder name and the remaining elements are its children, recursively processed.
   *
   * @param node - The current TreeNode to convert
   * @param name - Optional name of the current node (used for files or folders)
   * @returns A TreeItem representing the file or folder structure
   */
  function convertNode(node: TreeNode, name?: string): TreeItem[] | TreeItem {
    const entries = Object.entries(node);

    if (entries.length === 0) {
      return name || "";
    }

    const children: TreeItem[] = [];

    for (const [key, value] of entries) {
      if (value === null) {
        children.push(key);
      } else {
        const subTree = convertNode(value, key);
        if (Array.isArray(subTree)) {
          children.push([key, ...subTree]);
        } else {
          children.push([key, subTree]);
        }
      }
    }

    return children;
  }

  const result = convertNode(tree);
  return Array.isArray(result) ? result : [result];
}