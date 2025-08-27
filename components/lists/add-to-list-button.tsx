"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { List } from "lucide-react"
import { AddToListDialog } from "./add-to-list-dialog"

interface AddToListButtonProps {
  ruleId: string
  ruleTitle: string
  // Visual variant for different contexts
  variant?: "default" | "feed"
}

export function AddToListButton({ ruleId, ruleTitle, variant = "default" }: AddToListButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      {variant === "feed" ? (
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-end gap-1.5 px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-right"
          aria-label="Add to list"
        >
          <List className="h-3 w-3 text-[#70A7D7]" />
          <span className="text-xs text-gray-400">Add to List</span>
        </button>
      ) : (
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="secondary"
          size="sm"
        >
          <List className="h-3 w-3" />
          Add to List
        </Button>
      )}

      <AddToListDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        ruleId={ruleId}
        ruleTitle={ruleTitle}
      />
    </>
  )
}
