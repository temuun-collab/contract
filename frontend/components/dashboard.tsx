"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { FileText, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { TemplateCard } from "@/components/template-card"
import { UploadModal } from "@/components/upload-modal"
import { useContracts } from "@/lib/contract-context"
import type { Template } from "@/lib/types"

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

const TemplateEditor = dynamic(
  () => import("@/components/template-editor").then((mod) => mod.TemplateEditor),
  {
    ssr: false,
    loading: () => <FullScreenLoader />,
  }
)

const SigningView = dynamic(
  () => import("@/components/signing-view").then((mod) => mod.SigningView),
  {
    ssr: false,
    loading: () => <FullScreenLoader />,
  }
)

export function Dashboard() {
  const {
    templates,
    currentTemplate,
    currentView,
    isLoading,
    setCurrentTemplate,
    setCurrentView,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addField,
    updateField,
    deleteField,
  } = useContracts()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const handleUpload = async (file: File) => {
    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    )
    const pdfUrl = `data:application/pdf;base64,${base64}`

    const newTemplate: Template = {
      id: `t-${Date.now()}`,
      name: file.name.replace(".pdf", ""),
      fileName: file.name,
      pdfUrl,
      uploadDate: new Date().toISOString().split("T")[0],
      fields: [],
    }

    addTemplate(newTemplate)
    setCurrentTemplate(newTemplate)
    setCurrentView("editor")
  }

  const handleEditTemplate = (template: Template) => {
    setCurrentTemplate(template)
    setCurrentView("editor")
  }

  const handleSignTemplate = (template: Template) => {
    setCurrentTemplate(template)
    setCurrentView("signing")
  }

  const handleBackToDashboard = () => {
    setCurrentTemplate(null)
    setCurrentView("dashboard")
  }

  const handleSaveTemplate = (updates: Partial<Template>) => {
    if (currentTemplate) {
      updateTemplate(currentTemplate.id, updates)
    }
  }

  if (currentView === "editor" && currentTemplate) {
    return (
      <TemplateEditor
        template={currentTemplate}
        onBack={handleBackToDashboard}
        onSave={handleSaveTemplate}
        onAddField={(field) => addField(currentTemplate.id, field)}
        onUpdateField={(fieldId, updates) =>
          updateField(currentTemplate.id, fieldId, updates)
        }
        onDeleteField={(fieldId) => deleteField(currentTemplate.id, fieldId)}
      />
    )
  }

  if (currentView === "signing" && currentTemplate) {
    return (
      <SigningView
        template={currentTemplate}
        onBack={handleBackToDashboard}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader onUploadClick={() => setUploadModalOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onUploadClick={() => setUploadModalOpen(true)} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your contract templates and signature fields
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No templates yet</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Upload your first PDF to get started
            </p>
            <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Upload PDF
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEditTemplate(template)}
                onSign={() => handleSignTemplate(template)}
                onDelete={() => deleteTemplate(template.id)}
              />
            ))}
          </div>
        )}
      </main>

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleUpload}
      />
    </div>
  )
}
