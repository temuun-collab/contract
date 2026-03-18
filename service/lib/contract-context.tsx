"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Template, SignatureField } from "./types"

interface ContractContextType {
  templates: Template[]
  currentTemplate: Template | null
  currentView: "dashboard" | "editor" | "signing"
  isLoading: boolean
  setCurrentTemplate: (template: Template | null) => void
  setCurrentView: (view: "dashboard" | "editor" | "signing") => void
  addTemplate: (template: Template) => void
  updateTemplate: (id: string, updates: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  addField: (templateId: string, field: SignatureField) => void
  updateField: (templateId: string, fieldId: string, updates: Partial<SignatureField>) => void
  deleteField: (templateId: string, fieldId: string) => void
  refreshTemplates: () => void
}

const ContractContext = createContext<ContractContextType | undefined>(undefined)

const STORAGE_KEY = "contract-signing-templates"

function loadTemplatesFromStorage(): Template[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error loading templates from storage:", error)
  }
  return []
}

function saveTemplatesToStorage(templates: Template[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error("Error saving templates to storage:", error)
  }
}

export function ContractProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null)
  const [currentView, setCurrentView] = useState<"dashboard" | "editor" | "signing">("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  // Load templates from localStorage on mount
  useEffect(() => {
    const loaded = loadTemplatesFromStorage()
    setTemplates(loaded)
    setIsLoading(false)
  }, [])

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveTemplatesToStorage(templates)
    }
  }, [templates, isLoading])

  const refreshTemplates = useCallback(() => {
    const loaded = loadTemplatesFromStorage()
    setTemplates(loaded)
  }, [])

  const addTemplate = useCallback((template: Template) => {
    setTemplates(prev => [template, ...prev])
  }, [])

  const updateTemplate = useCallback((id: string, updates: Partial<Template>) => {
    setTemplates(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    )
    setCurrentTemplate(prev => 
      prev?.id === id ? { ...prev, ...updates } : prev
    )
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    if (currentTemplate?.id === id) {
      setCurrentTemplate(null)
      setCurrentView("dashboard")
    }
  }, [currentTemplate])

  const addField = useCallback((templateId: string, field: SignatureField) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId ? { ...t, fields: [...t.fields, field] } : t
      )
    )
    setCurrentTemplate(prev =>
      prev?.id === templateId ? { ...prev, fields: [...prev.fields, field] } : prev
    )
  }, [])

  const updateField = useCallback((templateId: string, fieldId: string, updates: Partial<SignatureField>) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? {
              ...t,
              fields: t.fields.map(f =>
                f.id === fieldId ? { ...f, ...updates } : f
              ),
            }
          : t
      )
    )
    setCurrentTemplate(prev =>
      prev?.id === templateId
        ? {
            ...prev,
            fields: prev.fields.map(f =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          }
        : prev
    )
  }, [])

  const deleteField = useCallback((templateId: string, fieldId: string) => {
    setTemplates(prev =>
      prev.map(t =>
        t.id === templateId
          ? { ...t, fields: t.fields.filter(f => f.id !== fieldId) }
          : t
      )
    )
    setCurrentTemplate(prev =>
      prev?.id === templateId
        ? { ...prev, fields: prev.fields.filter(f => f.id !== fieldId) }
        : prev
    )
  }, [])

  return (
    <ContractContext.Provider
      value={{
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
        refreshTemplates,
      }}
    >
      {children}
    </ContractContext.Provider>
  )
}

export function useContracts() {
  const context = useContext(ContractContext)
  if (context === undefined) {
    throw new Error("useContracts must be used within a ContractProvider")
  }
  return context
}
