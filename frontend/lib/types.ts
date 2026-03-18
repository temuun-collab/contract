export interface SignatureField {
  id: string
  page: number
  x: number
  y: number
  width: number
  height: number
  signature?: string
}

export interface Template {
  id: string
  name: string
  fileName: string
  pdfUrl?: string
  uploadDate: string
  fields: SignatureField[]
}
