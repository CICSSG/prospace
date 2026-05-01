"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Company } from "./types"
import { deleteCompanyFromCollection } from "../actions"
import { toast } from "sonner"
import Image from "next/image"

type DeleteCompanyDialogProps = {
  company: Company
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export default function DeleteCompanyDialog({
  company,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCompanyDialogProps) {
  const handleDelete = async () => {
    try {
      await deleteCompanyFromCollection(company.id)
      toast.success("Company deleted successfully")
      onDeleted()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting company:", error)
      toast.error("Failed to delete company")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Company</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>Are you sure you want to delete {company.name}?</p>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Image src={company.logoUrl || company.imageUrl} alt={company.name} width={72} height={72} className="rounded-md object-contain" />
            <div>
              <div className="font-medium">{company.name}</div>
              <div className="text-sm text-muted-foreground">{company.companyEmail}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
              Cancel
            </button>
            <button type="button" onClick={() => void handleDelete()} className="rounded-lg bg-destructive px-4 py-2 text-sm text-white hover:bg-destructive/90">
              Delete
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
