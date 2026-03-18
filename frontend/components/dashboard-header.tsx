"use client"

import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  onUploadClick: () => void
}

export function DashboardHeader({ onUploadClick }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SignFlow</span>
        </div>
        <Button onClick={onUploadClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>
    </header>
  )
}
