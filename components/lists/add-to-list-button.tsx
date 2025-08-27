"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { List } from "lucide-react"
import { AddToListDialog } from "./add-to-list-dialog"

interface AddToListButtonProps {
  ruleId: string
  ruleTitle: string
}

export function AddToListButton({ ruleId, ruleTitle }: AddToListButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="secondary"
        size="sm"
      >
        <List className="h-3 w-3" />
        Add to List
      </Button>

      <AddToListDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        ruleId={ruleId}
        ruleTitle={ruleTitle}
      />
    </>
  )
}
