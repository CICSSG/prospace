"use client"

import { PaginationComponent } from "@/components/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, RefreshCw, PencilLine, Trash2, ExternalLink } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getCollectionData } from "../actions"
import CompanyFormDialog from "./company-form-dialog"
import DeleteCompanyDialog from "./delete-company-dialog"
import { Company } from "./types"

const emptyList: Company[] = []

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>(emptyList)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "hasImage" | "hasLogo" | "hasSocials" | "hasDescription">("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null)

  type CompanyCollectionItem = {
    _id: string
    imageUrl?: string
    name?: string
    logoUrl?: string
    socialLinks?: unknown
    companyEmail?: string
    moderatorEmails?: unknown
    description?: string
  }

  const getData = useCallback(() => {
    getCollectionData("companies")
      .then((response) => {
        if (response.success) {
          const mappedCompanies: Company[] = (response.data || []).map((item: CompanyCollectionItem) => ({
            id: item._id,
            imageUrl: item.imageUrl || "",
            name: item.name || "",
            logoUrl: item.logoUrl || "",
            socialLinks: Array.isArray(item.socialLinks) ? (item.socialLinks as Company["socialLinks"]) : [],
            companyEmail: item.companyEmail || "",
            moderatorEmails: Array.isArray(item.moderatorEmails)
              ? item.moderatorEmails.filter((email): email is string => typeof email === "string")
              : typeof item.moderatorEmails === "string"
                ? [item.moderatorEmails]
                : [],
            description: item.description || "",
          }))

          setCompanies(mappedCompanies)
          toast.success("Company data loaded")
        } else {
          toast.error("Failed to fetch company data")
        }
      })
      .catch((error) => {
        console.error("Error fetching company data:", error)
        toast.error("Failed to fetch company data")
      })
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  const normalizedSearch = search.trim().toLowerCase()
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      normalizedSearch === "" ||
      company.name.toLowerCase().includes(normalizedSearch) ||
      company.companyEmail.toLowerCase().includes(normalizedSearch) ||
      company.moderatorEmails.some((email) => email.toLowerCase().includes(normalizedSearch)) ||
      company.description.toLowerCase().includes(normalizedSearch) ||
      company.socialLinks.some(
        (link) =>
          link.platform.toLowerCase().includes(normalizedSearch) ||
          link.url.toLowerCase().includes(normalizedSearch)
      )

    const matchesFilter =
      filter === "all" ||
      (filter === "hasImage" && Boolean(company.imageUrl)) ||
      (filter === "hasLogo" && Boolean(company.logoUrl)) ||
      (filter === "hasSocials" && company.socialLinks.length > 0) ||
      (filter === "hasDescription" && Boolean(company.description.trim()))

    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleFilterChange = (value: typeof filter) => {
    setFilter(value)
    setPage(1)
  }

  const handleItemsPerPageChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
    const nextValue = typeof value === "function" ? value(itemsPerPage) : value
    setItemsPerPage(nextValue)
    setPage(1)
  }

  const renderSocialLinks = (socialLinks: Company["socialLinks"]) => {
    if (socialLinks.length === 0) {
      return <span className="text-sm text-muted-foreground">No links</span>
    }

    return (
      <div className="flex flex-col gap-1">
        {socialLinks.slice(0, 3).map((link, index) => (
          <a
            key={`${link.platform}-${index}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink size={12} />
            {link.platform || "Link"}
          </a>
        ))}
        {socialLinks.length > 3 && (
          <span className="text-xs text-muted-foreground">+{socialLinks.length - 3} more</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Company List</h1>
          <p className="text-sm text-muted-foreground">Manage company cards, contact details, and public links.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Add Company
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

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name, email, description, or social link"
            className="w-full rounded-lg border bg-foreground/10 px-3 py-2 text-sm text-muted-foreground transition-all focus:text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />

          <select
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value as typeof filter)}
            className="rounded-lg border bg-foreground/40 text-background px-3 py-2 text-sm"
          >
            <option value="all">All records</option>
            <option value="hasImage">Has image</option>
            <option value="hasLogo">Has logo</option>
            <option value="hasSocials">Has social links</option>
            <option value="hasDescription">Has description</option>
          </select>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {filteredCompanies.length} result{filteredCompanies.length === 1 ? "" : "s"}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Logo</TableHead>
              <TableHead>Social Links</TableHead>
              <TableHead>Emails</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCompanies.length > 0 ? (
              paginatedCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    {company.imageUrl ? (
                      <Image
                        src={company.imageUrl}
                        alt={company.name}
                        width={72}
                        height={72}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No image</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {company.id.slice(0, 8)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.logoUrl ? (
                      <Image
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        width={72}
                        height={72}
                        className="h-16 w-16 rounded-lg object-contain"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No logo</span>
                    )}
                  </TableCell>
                  <TableCell>{renderSocialLinks(company.socialLinks)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Company:</span> {company.companyEmail || "-"}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium">Moderators:</div>
                        {company.moderatorEmails.length > 0 ? (
                          company.moderatorEmails.map((email) => (
                            <div key={email} className="text-xs text-muted-foreground">
                              {email}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground">-</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[20rem] text-sm text-muted-foreground line-clamp-3">
                      {company.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditCompany(company)}
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                        title="Edit company"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCompany(company)}
                        className="inline-flex items-center rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive hover:text-white"
                        title="Delete company"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7}>
                <PaginationComponent
                  setItemsPerPage={handleItemsPerPageChange}
                  setPage={setPage}
                  page={currentPage}
                  totalPages={totalPages}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>

      {addOpen && (
        <CompanyFormDialog
          key="add-company"
          open={addOpen}
          mode="add"
          onOpenChange={setAddOpen}
          onSaved={getData}
        />
      )}

      {editCompany && (
        <CompanyFormDialog
          key={editCompany.id}
          open={Boolean(editCompany)}
          mode="edit"
          company={editCompany}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditCompany(null)
            }
          }}
          onSaved={getData}
        />
      )}

      {deleteCompany && (
        <DeleteCompanyDialog
          company={deleteCompany}
          open={Boolean(deleteCompany)}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setDeleteCompany(null)
            }
          }}
          onDeleted={getData}
        />
      )}
    </div>
  )
}
