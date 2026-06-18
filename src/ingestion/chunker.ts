import { readFileSync, readdirSync } from "fs";
import { join, relative } from "path";
import Parser, { SyntaxNode } from "tree-sitter";
import TypeScript from "tree-sitter-typescript";

export type CodeChunk = {
  text: string;
  filePath: string;
  startLine: number;
  endLine: number;
  type: "function" | "class" | "method" | "arrow_function";
};

function makeChunk(
  node: SyntaxNode,
  type: CodeChunk["type"],
  relativePath: string
): CodeChunk {
  return {
    text: node.text,
    filePath: relativePath,
    startLine: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    type,
  };
}

function walk(node: SyntaxNode, relativePath: string, chunks: CodeChunk[]): void {
  for (const child of node.namedChildren) {
    switch (child.type) {
      case "class_declaration": {
        chunks.push(makeChunk(child, "class", relativePath));
        const classBody = child.childForFieldName("body");
        if (classBody) {
          for (const member of classBody.namedChildren) {
            if (member.type === "method_definition") {
              chunks.push(makeChunk(member, "method", relativePath));
            }
          }
        }
        break;
      }
      case "function_declaration":
        chunks.push(makeChunk(child, "function", relativePath));
        break;
      // Note: only catches bare arrow functions at scope level. Most exported arrow functions are wrapped in variable_declaration or export_statement and will be caught by the parent node's default walk instead.
      case "arrow_function":
        chunks.push(makeChunk(child, "arrow_function", relativePath));
        break;
      case "method_definition":
        chunks.push(makeChunk(child, "method", relativePath));
        break;
      default:
        walk(child, relativePath, chunks);
    }
  }
}

export function chunkFile(filePath: string, relativePath: string): CodeChunk[] {
  const source = readFileSync(filePath, "utf-8");
  const parser = new Parser();
  parser.setLanguage(TypeScript.typescript);
  const tree = parser.parse(source);

  const chunks: CodeChunk[] = [];
  walk(tree.rootNode, relativePath, chunks);
  return chunks;
}

function collectTsFiles(dir: string, srcRoot: string, files: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      collectTsFiles(join(dir, entry.name), srcRoot, files);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".d.ts")) continue;
      if (entry.name.endsWith(".ts")) {
        files.push(join(dir, entry.name));
      }
    }
  }
}

export function chunkRepo(repoPath: string): CodeChunk[] {
  const srcRoot = join(repoPath, "src");
  const files: string[] = [];
  collectTsFiles(srcRoot, srcRoot, files);

  const chunks: CodeChunk[] = [];
  for (const filePath of files) {
    const relativePath = relative(repoPath, filePath);
    chunks.push(...chunkFile(filePath, relativePath));
  }
  return chunks;
}
