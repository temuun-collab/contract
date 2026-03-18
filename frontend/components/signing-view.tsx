"use client"

import { useState } from "react"
import { ArrowLeft, Check, FileText } from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import { Button } from "@/components/ui/button"
import { SignatureModal } from "@/components/signature-modal"
import type { Template, SignatureField } from "@/lib/types"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface SigningViewProps {
  template: Template
  onBack: () => void
}

export function SigningView({ template, onBack }: SigningViewProps) {
  const [fields, setFields] = useState<SignatureField[]>(template.fields)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [numPages, setNumPages] = useState<number>(0)

  const signedCount = fields.filter((f) => f.signature).length
  const totalCount = fields.length
  const allSigned = signedCount === totalCount && totalCount > 0

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleFieldClick = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (field && !field.signature) {
      setActiveFieldId(fieldId)
      setSignatureModalOpen(true)
    }
  }

  const handleSignatureSave = (signature: string) => {
    if (activeFieldId) {
      setFields((prev) =>
        prev.map((f) =>
          f.id === activeFieldId ? { ...f, signature } : f
        )
      )
      setActiveFieldId(null)
    }
  }

  const handleComplete = () => {
    setIsComplete(true)
  }

  const renderPageFields = (page: number) => {
    return fields
      .filter((f) => f.page === page)
      .map((field) => (
        <div
          key={field.id}
          className={`absolute rounded-lg border-2 transition-all ${
            field.signature
              ? "border-green-500 bg-green-50"
              : "cursor-pointer border-accent bg-accent/5 hover:bg-accent/10"
          }`}
          style={{
            left: field.x,
            top: field.y,
            width: field.width,
            height: field.height,
          }}
          onClick={() => handleFieldClick(field.id)}
        >
          <div className="flex h-full items-center justify-center">
            {field.signature ? (
              <img
                src={field.signature}
                alt="Signature"
                className="max-h-full max-w-full object-contain p-1"
                crossOrigin="anonymous"
              />
            ) : (
              <span className="text-xs font-medium text-accent">
                Click to Sign
              </span>
            )}
          </div>
        </div>
      ))
  }

  if (isComplete) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold">Document Signed</h1>
          <p className="mb-8 text-muted-foreground">
            The document has been signed successfully.
          </p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{template.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {signedCount} of {totalCount} fields signed
          </span>
          <Button onClick={handleComplete} disabled={!allSigned}>
            Complete Signing
          </Button>
        </div>
      </header>

      {/* Signing Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="relative mx-auto h-full overflow-auto rounded-xl border border-border bg-muted/30 p-6">
          <div className="mx-auto flex flex-col items-center gap-6">
            {template.pdfUrl ? (
              <Document
                file={template.pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex h-[842px] w-[595px] items-center justify-center bg-card shadow-sm">
                    <p className="text-muted-foreground">Loading PDF...</p>
                  </div>
                }
                error={
                  <div className="flex h-[842px] w-[595px] items-center justify-center bg-card shadow-sm">
                    <p className="text-destructive">Failed to load PDF</p>
                  </div>
                }
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <div
                    key={`page_${index + 1}`}
                    className="relative mb-6 bg-card shadow-sm [&_.react-pdf\_\_Page\_\_textContent]:pointer-events-none [&_.react-pdf\_\_Page\_\_annotations]:pointer-events-none"
                  >
                    <Page
                      pageNumber={index + 1}
                      width={595}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                    <div className="absolute inset-0 z-10">
                      {renderPageFields(index + 1)}
                    </div>
                  </div>
                ))}
              </Document>
            ) : (
              <div
                className="relative bg-card shadow-sm"
                style={{ width: 595, height: 842 }}
              >
                {/* Mock PDF Page */}
                <div className="absolute inset-0 p-12 pointer-events-none">
                  <div className="space-y-4">
                    <div className="h-8 w-48 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-5/6 rounded bg-muted" />
                    <div className="h-4 w-4/5 rounded bg-muted" />
                    <div className="mt-8 h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                </div>
                <div className="absolute inset-0 z-10">
                  {renderPageFields(1)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onSave={handleSignatureSave}
      />
    </div>
  )
}
