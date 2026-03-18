"use client"

import { FileText, Calendar, PenLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Template } from "@/lib/types"

interface TemplateCardProps {
  template: Template
  onEdit: () => void
  onSign: () => void
  onDelete?: () => void
}

export function TemplateCard({ template, onEdit, onSign, onDelete }: TemplateCardProps) {
  const formattedDate = new Date(template.uploadDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-foreground leading-tight">{template.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{template.fileName}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <PenLine className="h-3.5 w-3.5" />
              {template.fields.length} field{template.fields.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              Edit Template
            </Button>
            <Button size="sm" className="flex-1" onClick={onSign}>
              Sign
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
