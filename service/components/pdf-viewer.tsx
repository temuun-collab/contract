"use client"

import { useRef, useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import type { SignatureField } from "@/lib/types"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  pdfUrl?: string
  fields: SignatureField[]
  onAddField: (field: Omit<SignatureField, "id">) => void
  onUpdateField: (fieldId: string, updates: Partial<SignatureField>) => void
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
  isEditing?: boolean
}

export function PDFViewer({
  pdfUrl,
  fields,
  onAddField,
  onUpdateField,
  selectedFieldId,
  onSelectField,
  isEditing = true,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizing, setResizing] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState(595)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (!isEditing) return
    if (dragging || resizing) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on existing field on this page
    const clickedField = fields.find(
      (f) =>
        f.page === page &&
        x >= f.x &&
        x <= f.x + f.width &&
        y >= f.y &&
        y <= f.y + f.height
    )

    if (clickedField) {
      onSelectField(clickedField.id)
      return
    }

    // Add new field
    onAddField({
      page,
      x: Math.max(0, x - 100),
      y: Math.max(0, y - 30),
      width: 200,
      height: 60,
    })
  }

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, isResize = false) => {
    if (!isEditing) return
    e.stopPropagation()
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return

    if (isResize) {
      setResizing(fieldId)
    } else {
      setDragging(fieldId)
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    onSelectField(fieldId)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const pages = containerRef.current.querySelectorAll('[data-page]')
      
      if (dragging) {
        const field = fields.find((f) => f.id === dragging)
        if (!field) return

        const pageEl = pages[field.page - 1]
        if (!pageEl) return

        const rect = pageEl.getBoundingClientRect()
        let newX = e.clientX - rect.left - dragOffset.x
        let newY = e.clientY - rect.top - dragOffset.y

        // Constrain to page
        newX = Math.max(0, Math.min(newX, rect.width - field.width))
        newY = Math.max(0, Math.min(newY, rect.height - field.height))

        onUpdateField(dragging, { x: newX, y: newY })
      }

      if (resizing) {
        const field = fields.find((f) => f.id === resizing)
        if (!field) return

        const pageEl = pages[field.page - 1]
        if (!pageEl) return

        const rect = pageEl.getBoundingClientRect()
        const newWidth = Math.max(100, e.clientX - rect.left - field.x)
        const newHeight = Math.max(40, e.clientY - rect.top - field.y)

        onUpdateField(resizing, { width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
      setResizing(null)
    }

    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragging, resizing, fields, dragOffset, onUpdateField])

  const renderPageFields = (page: number) => {
    return fields
      .filter((f) => f.page === page)
      .map((field) => (
        <div
          key={field.id}
          className={`absolute cursor-move rounded-lg border-2 transition-colors ${
            selectedFieldId === field.id
              ? "border-accent bg-accent/10"
              : "border-accent/50 bg-accent/5 hover:border-accent"
          }`}
          style={{
            left: field.x,
            top: field.y,
            width: field.width,
            height: field.height,
          }}
          onMouseDown={(e) => handleMouseDown(e, field.id)}
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
                Signature
              </span>
            )}
          </div>
          {isEditing && selectedFieldId === field.id && (
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-accent"
              onMouseDown={(e) => handleMouseDown(e, field.id, true)}
            />
          )}
        </div>
      ))
  }

  return (
    <div className="relative h-full overflow-auto rounded-xl border border-border bg-muted/30 p-6" ref={containerRef}>
      <div className="mx-auto flex flex-col items-center gap-6">
        {pdfUrl ? (
          <Document
            file={pdfUrl}
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
                data-page={index + 1}
                className="relative mb-6 bg-card shadow-sm [&_.react-pdf\_\_Page\_\_textContent]:pointer-events-none [&_.react-pdf\_\_Page\_\_annotations]:pointer-events-none"
                onClick={(e) => handleCanvasClick(e, index + 1)}
              >
                <Page
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
                <div className="absolute inset-0 z-10">
                  {renderPageFields(index + 1)}
                </div>
                {isEditing && fields.filter(f => f.page === index + 1).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="rounded-lg bg-foreground/80 px-4 py-2 text-sm text-background">
                      Click to add a signature field
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Document>
        ) : (
          // Fallback mock PDF when no URL is provided
          <div
            className="relative bg-card shadow-sm"
            style={{ width: 595, height: 842 }}
            onClick={(e) => handleCanvasClick(e, 1)}
            data-page={1}
          >
            <div className="absolute inset-0 p-12 pointer-events-none">
              <div className="space-y-4">
                <div className="h-8 w-48 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
                <div className="mt-8 h-4 w-full rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="mt-8 h-4 w-full rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
            <div className="absolute inset-0 z-10">
              {renderPageFields(1)}
            </div>
            {isEditing && fields.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="rounded-lg bg-foreground/80 px-4 py-2 text-sm text-background">
                  Click anywhere to add a signature field
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
