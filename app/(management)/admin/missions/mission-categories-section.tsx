"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RefreshCw, PencilLine, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { getCollectionData } from "../actions"
import DeleteMissionCategoryDialog from "./delete-mission-category-dialog"
import MissionCategoryFormDialog from "./mission-category-form-dialog"
import { MissionCategory } from "./types"

const emptyList: MissionCategory[] = []

type MissionCategoryCollectionItem = {
  _id: string
  categoryName?: string
  createdAt?: string
  updatedAt?: string
}

function formatDateTime(value?: string) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MissionCategoriesSection() {
  const [categories, setCategories] = useState<MissionCategory[]>(emptyList)
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<MissionCategory | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<MissionCategory | null>(null)

  const getData = useCallback(() => {
    getCollectionData("missionCategories")
      .then((response) => {
        if (response.success) {
          const mappedCategories: MissionCategory[] = (response.data || []).map((item: MissionCategoryCollectionItem) => ({
            id: item._id,
            // support alternative field names if categoryName was removed (e.g., `name` or `title`)
            categoryName: (item as any).categoryName || (item as any).name || (item as any).title || "",
            createdAt: item.createdAt || "",
            updatedAt: item.updatedAt || "",
          }))

          setCategories(mappedCategories)
          toast.success("Mission categories loaded")
        } else {
          toast.error("Failed to fetch mission categories")
        }
      })
      .catch((error) => {
        console.error("Error fetching mission categories:", error)
        toast.error("Failed to fetch mission categories")
      })
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredCategories = categories.filter((category) => {
    return normalizedSearch === "" || category.categoryName.toLowerCase().includes(normalizedSearch)
  })

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mission Categories</h2>
          <p className="text-sm text-muted-foreground">Manage the category names used by mission records.</p>
        </div>

        <div className="flex flex-nowrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 text-nowrap"
          >
            <Plus size={16} /> Add Category
          </button>
          <button
            type="button"
            onClick={getData}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by category name"
          className="w-full rounded-lg border bg-foreground/10 px-3 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
        />

        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {filteredCategories.length} result{filteredCategories.length === 1 ? "" : "s"}
        </div>
      </div>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Category Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{category.categoryName}</div>
                    {/* <div className="text-xs text-muted-foreground">ID: {category.id.slice(0, 8)}</div> */}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="ml-auto flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCategory(category)}
                      className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                      title="Edit category"
                    >
                      <PencilLine size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCategory(category)}
                      className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No mission categories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {addOpen && (
        <MissionCategoryFormDialog
          key="add-mission-category"
          open={addOpen}
          mode="add"
          onOpenChange={setAddOpen}
          onSaved={getData}
        />
      )}

      {editCategory && (
        <MissionCategoryFormDialog
          key={editCategory.id}
          open={Boolean(editCategory)}
          mode="edit"
          category={editCategory}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditCategory(null)
            }
          }}
          onSaved={getData}
        />
      )}

      {deleteCategory && (
        <DeleteMissionCategoryDialog
          category={deleteCategory}
          setDeleteCategory={setDeleteCategory}
          getData={getData}
        />
      )}
    </section>
  )
}