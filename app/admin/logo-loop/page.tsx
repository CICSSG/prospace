"use client"
import { PaginationComponent } from "@/components/pagination"
import { Dialog } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pen, Plus, RefreshCw, Trash2, X } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { useForm } from "@tanstack/react-form"
import z from "zod"
import AddLogoDialog from "./add-logo"
import { getCollectionData } from "../actions"
import DeleteLogoDialog from "./delete-logo"
import EditLogoDialog from "./edit-logo"

const tempData = [
  {
    id: "1",
    logoUrl: "/images/CICSSG.png",
    companyName:
      "College of Information and Computer Studies Student Government",
    companyUrl: "https://cicssg.com",
  }
]
type Logo = {
  id: string
  logoUrl: string
  companyName: string
  companyUrl: string
}

const LogoLoop = () => {
  const [logos, setLogos] = useState(tempData)
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [paginatedLogos, setPaginatedLogos] = useState(tempData)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteLogo, setDeleteLogo] = useState<Logo | null>(null)
  const [editLogo, setEditLogo] = useState<Logo | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "hasUrl" | "noUrl">("all")

  function getData() {
    getCollectionData("logoLoop").then((data) => {
      if (data.success) {
        setLogos(
          data.data.map((item: any, index: number) => ({
            id: item._id,
            logoUrl: item.logoUrl,
            companyName: item.companyName,
            companyUrl: item.companyUrl,
          }))
        )
        toast.success("Data Loaded")
      } else {
        toast.error("Failed to fetch logo loop data")
      }
    })
  }

  useEffect(() => {
    getData()
  }, [])

  const viewLogo = (id: string) => {
    const logo = logos.find((logo) => logo.id === id)
    if (logo) {
      toast(`Viewing logo for ${logo.companyName}`)
      setSelectedLogoId(id)
    }
  }

  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filteredCount = logos.filter((l) => {
      const matchesSearch =
        normalizedSearch === "" ||
        l.companyName.toLowerCase().includes(normalizedSearch) ||
        l.companyUrl.toLowerCase().includes(normalizedSearch)

      const matchesFilter =
        filter === "all" || (filter === "hasUrl" && l.companyUrl) ||
        (filter === "noUrl" && !l.companyUrl)

      return matchesSearch && matchesFilter
    }).length

    setTotalPages(Math.max(1, Math.ceil(filteredCount / itemsPerPage)))
  }, [logos, itemsPerPage, search, filter])

  useEffect(() => {
    // apply search and filter first
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = logos.filter((l) => {
      const matchesSearch =
        normalizedSearch === "" ||
        l.companyName.toLowerCase().includes(normalizedSearch) ||
        l.companyUrl.toLowerCase().includes(normalizedSearch)

      const matchesFilter =
        filter === "all" || (filter === "hasUrl" && l.companyUrl) ||
        (filter === "noUrl" && !l.companyUrl)

      return matchesSearch && matchesFilter
    })

    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedLogos(filtered.slice(startIndex, endIndex))
  }, [page, itemsPerPage, logos, search, filter])

  useEffect(() => {
    // reset to first page when search or filter changes
    setPage(1)
  }, [search, filter])

  return (
    <div className="flex flex-col gap-2">
      <div className="mx-4 flex flex-row items-center justify-between">
        <h1 className="text-2xl font-semibold">Logo Loop Manager</h1>
        <div className="flex flex-row gap-2">
          <button
            className="flex cursor-pointer flex-row items-center justify-center gap-1 rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/80"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus size={16} /> Add Logo
          </button>
          <button
            className="flex w-fit cursor-pointer flex-row items-center justify-center gap-1 rounded bg-primary-foreground px-3 py-1 text-primary hover:bg-primary/80 hover:text-primary-foreground"
            onClick={getData}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      <hr />

      <section className="rounded-xl bg-secondary p-3 shadow-sm">
        <div className="mb-3 flex flex-row items-center justify-between gap-2">
          <div className="flex w-1/2 items-center gap-2">
            <input
              type="text"
              placeholder="Search company or URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground transition-all focus:text-black focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border bg-white px-3 py-2 text-sm text-muted-foreground transition-all focus:text-black focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="hasUrl">Has URL</option>
              <option value="noUrl">No URL</option>
            </select>
          </div>
        </div>
        <Table>
          {/* <TableCaption>List of logos in the loop</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Logo</TableHead>
              <TableHead className="w-50">Company</TableHead>
              <TableHead className="w-full">URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogos.map((logo) => { 
              console.log("Rendering logo:", logo)
              
              return (
              <TableRow key={logo.id}>
                <TableCell>
                  <button
                    onClick={() => viewLogo(logo.id)}
                    className="cursor-pointer flex h-full"
                  >
                    <Image
                      src={logo.logoUrl}
                      alt="Logo"
                      width={128}
                      height={128}
                      className="object-contain h-full aspect-square"
                    />
                  </button>
                </TableCell>
                <TableCell>{logo.companyName}</TableCell>
                <TableCell>{logo.companyUrl}</TableCell>
                <TableCell className="flex flex-row gap-1 text-right ml-auto">
                  <button
                    className="cursor-pointer rounded border border-primary p-2 text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:underline"
                    onClick={() => setEditLogo(logo)}
                    title="Edit"
                  >
                    <Pen size={18} />
                  </button>
                  <button className="cursor-pointer rounded border border-destructive p-2 text-destructive transition-all hover:bg-destructive hover:text-primary-foreground hover:underline" onClick={() => setDeleteLogo(logo)}>
                    <Trash2 size={18} />
                  </button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                <PaginationComponent
                  setItemsPerPage={setItemsPerPage}
                  setPage={setPage}
                  page={page}
                  totalPages={totalPages}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>

      {selectedLogoId && (
        <Dialog
          open={!!selectedLogoId}
          onOpenChange={() => setSelectedLogoId(null)}
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative rounded-xl border-2 border-primary/50 bg-white/10 p-4">
              <button
                className="absolute -top-3 -right-3 cursor-pointer rounded-full bg-primary/50 p-1 text-white/50 transition-colors hover:bg-primary hover:text-white"
                onClick={() => setSelectedLogoId(null)}
              >
                <X size={20} />
              </button>
              <Image
                src={
                  logos.find((logo) => logo.id === selectedLogoId)?.logoUrl ||
                  ""
                }
                alt="Selected Logo"
                width={256}
                height={256}
                className=""
              />
            </div>
          </div>
        </Dialog>
      )}

      {addDialogOpen && (
        <AddLogoDialog setAddDialogOpen={setAddDialogOpen} getData={getData} />
      )}

      {deleteLogo && (
        <DeleteLogoDialog logo={deleteLogo} setDeleteLogo={setDeleteLogo} getData={getData} />
      )}

      {editLogo && (
        <EditLogoDialog logo={editLogo} setEditLogo={setEditLogo} getData={getData} />
      )}
    </div>
  )
}

export default LogoLoop
