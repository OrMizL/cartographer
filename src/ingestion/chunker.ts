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

const MAX_SOURCE_LENGTH = 100_000;
const SEGMENT_SIZE = 80_000;
const SEGMENT_OVERLAP = 5_000;

export function chunkFile(filePath: string, relativePath: string): CodeChunk[] {
  try {
    const source = readFileSync(filePath, "utf-8");
    const parser = new Parser();
    parser.setLanguage(TypeScript.typescript);
    parser.setTimeoutMicros(5_000_000);

    if (source.length <= MAX_SOURCE_LENGTH) {
      const tree = parser.parse(source);
      const chunks: CodeChunk[] = [];
      walk(tree.rootNode, relativePath, chunks);
      return chunks;
    }

    const chunksByStartLine = new Map<number, CodeChunk>();
    let segmentStart = 0;
    while (segmentStart < source.length) {
      const segmentEnd = Math.min(segmentStart + SEGMENT_SIZE, source.length);
      const segmentText = source.slice(segmentStart, segmentEnd);
      const lineOffset = source.slice(0, segmentStart).split("\n").length - 1;

      const tree = parser.parse(segmentText);
      const segmentChunks: CodeChunk[] = [];
      walk(tree.rootNode, relativePath, segmentChunks);

      for (const chunk of segmentChunks) {
        chunksByStartLine.set(chunk.startLine + lineOffset, {
          ...chunk,
          startLine: chunk.startLine + lineOffset,
          endLine: chunk.endLine + lineOffset,
        });
      }

      if (segmentEnd === source.length) break;
      segmentStart += SEGMENT_SIZE - SEGMENT_OVERLAP;
    }

    return Array.from(chunksByStartLine.values());
  } catch (error) {
    console.warn(
      `Skipping ${relativePath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

const SKIP_DIRS = new Set(["node_modules", "dist", "test", "__tests__"]);

function collectTsFiles(dir: string, srcRoot: string, files: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectTsFiles(join(dir, entry.name), srcRoot, files);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".tsx")) continue;
      if (entry.name.endsWith(".d.ts")) continue;
      if (entry.name.endsWith(".ts")) {
        files.push(join(dir, entry.name));
      }
    }
  }
}

function findSrcDirs(dir: string, depth: number, maxDepth: number): string[] {
  if (depth > maxDepth) return [];

  const srcDirs: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.name === "src") {
      srcDirs.push(fullPath);
    }
    srcDirs.push(...findSrcDirs(fullPath, depth + 1, maxDepth));
  }
  return srcDirs;
}

export function chunkRepo(repoPath: string): CodeChunk[] {
  const srcDirs = findSrcDirs(repoPath, 0, 4);

  const files: string[] = [];
  for (const srcRoot of srcDirs) {
    collectTsFiles(srcRoot, srcRoot, files);
  }

  const chunks: CodeChunk[] = [];
  for (const filePath of files) {
    const relativePath = relative(repoPath, filePath);
    chunks.push(...chunkFile(filePath, relativePath));
  }
  return chunks;
}
