"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Check, List } from "lucide-react"
import { toast } from "sonner"

interface List {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface AddToListDialogProps {
  isOpen: boolean
  onClose: () => void
  ruleId: string
  ruleTitle: string
}

export function AddToListDialog({ isOpen, onClose, ruleId, ruleTitle }: AddToListDialogProps) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  // Fetch user's lists when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchLists()
    }
  }, [isOpen])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data)
      } else {
        console.error('Failed to fetch lists')
        setLists([])
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      setLists([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      toast.error("Please enter a list name")
      return
    }

    setSubmitting(true)
    try {
      // Create the list
      const createResponse = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle.trim() })
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create list')
      }

      const newList = await createResponse.json()

      // Add the rule to the new list
      const addResponse = await fetch(`/api/lists/${newList.id}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      })

      if (!addResponse.ok) {
        throw new Error('Failed to add rule to list')
      }

      toast.success(`Created "${newListTitle}" and added rule!`)
      onClose()
      resetDialog()
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error('Failed to create list')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddToExistingList = async () => {
    if (!selectedListId) {
      toast.error("Please select a list")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${selectedListId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add rule to list')
      }

      const selectedList = lists.find(l => l.id === selectedListId)
      toast.success(`Added rule to "${selectedList?.title}"!`)
      onClose()
      resetDialog()
    } catch (error: any) {
      console.error('Error adding to list:', error)
      if (error.message.includes('already in this list')) {
        toast.error('Rule is already in this list')
      } else {
        toast.error('Failed to add rule to list')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetDialog = () => {
    setCreateMode(false)
    setNewListTitle("")
    setSelectedListId("")
    setSubmitting(false)
  }

  const handleClose = () => {
    onClose()
    resetDialog()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#1B1D21] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add to List</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add "{ruleTitle}" to a list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-gray-400">Loading lists...</div>
          ) : (
            <>
              {/* Create new list mode */}
              {createMode ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Enter list name"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    className="bg-[#0F1419] border-white/10 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateList}
                      disabled={submitting || !newListTitle.trim()}
                      className="flex-1"
                    >
                      {submitting ? "Creating..." : "Create & Add"}
                    </Button>
                    <Button
                      onClick={() => setCreateMode(false)}
                      variant="outline"
                      className="border-white/10 bg-transparent hover:bg-white/5"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Existing lists */}
                  {lists.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-400 mb-2">Select existing list:</div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {lists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => setSelectedListId(list.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedListId === list.id
                                ? "border-[#70A7D7] bg-[#70A7D7]/10"
                                : "border-white/10 bg-[#0F1419] hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <List className="h-4 w-4 text-gray-400" />
                              <span className="text-white">{list.title}</span>
                              {selectedListId === list.id && (
                                <Check className="h-4 w-4 text-[#70A7D7] ml-auto" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No lists found. Create your first list!
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCreateMode(true)}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New List
                    </Button>
                    {lists.length > 0 && (
                      <Button
                        onClick={handleAddToExistingList}
                        disabled={!selectedListId || submitting}
                        className="flex-1"
                      >
                        {submitting ? "Adding..." : "Add to List"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleClose} 
            variant="outline"
            className="border-white/10 bg-transparent hover:bg-white/5"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
