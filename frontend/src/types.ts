export type Repo = {
  id: string
  name: string
  description: string
  url: string
}

export type Chunk = {
  filePath: string
  startLine: number
  endLine: number
  type: string
  distance: number
}

export type QueryResponse = {
  answer: string
  chunks: Chunk[]
}
