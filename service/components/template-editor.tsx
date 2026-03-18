"use client"

import { useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PDFViewer } from "@/components/pdf-viewer"
import { FieldControls } from "@/components/field-controls"
import type { Template, SignatureField } from "@/lib/types"

interface TemplateEditorProps {
  template: Template
  onBack: () => void
  onSave: (updates: Partial<Template>) => void
  onAddField: (field: SignatureField) => void
  onUpdateField: (fieldId: string, updates: Partial<SignatureField>) => void
  onDeleteField: (fieldId: string) => void
}

export function TemplateEditor({
  template,
  onBack,
  onSave,
  onAddField,
  onUpdateField,
  onDeleteField,
}: TemplateEditorProps) {
  const [name, setName] = useState(template.name)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    onSave({ name })
    setTimeout(() => {
      setIsSaving(false)
    }, 500)
  }

  const handleAddField = (field: Omit<SignatureField, "id">) => {
    const newField: SignatureField = {
      ...field,
      id: `f-${Date.now()}`,
    }
    onAddField(newField)
    setSelectedFieldId(newField.id)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 w-64 border-transparent bg-transparent text-base font-medium hover:border-border focus:border-border"
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Template"}
        </Button>
      </header>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-6">
          <PDFViewer
            pdfUrl={template.pdfUrl}
            fields={template.fields}
            onAddField={handleAddField}
            onUpdateField={onUpdateField}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            isEditing={true}
          />
        </div>

        {/* Field Controls Panel */}
        <div className="w-80 border-l border-border bg-card p-4">
          <FieldControls
            fields={template.fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onDeleteField={onDeleteField}
          />
        </div>
      </div>
    </div>
  )
}
