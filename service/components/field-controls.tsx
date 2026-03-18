"use client"

import { Trash2, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SignatureField } from "@/lib/types"

interface FieldControlsProps {
  fields: SignatureField[]
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
  onDeleteField: (fieldId: string) => void
}

export function FieldControls({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
}: FieldControlsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Signature Fields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No fields added yet. Click on the PDF to add a signature field.
          </p>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
                selectedFieldId === field.id
                  ? "border-accent bg-accent/5"
                  : "border-border hover:bg-muted/50"
              }`}
              onClick={() => onSelectField(field.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">Signature Field</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Page {field.page}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Move className="h-3 w-3" />
                      {Math.round(field.x)}, {Math.round(field.y)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteField(field.id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
