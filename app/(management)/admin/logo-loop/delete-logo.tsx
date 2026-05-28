import { toast } from "sonner"
import { deleteLogoFromLoop } from "../actions"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import Image from "next/image"

type Logo = {
  id: string
  logoUrl: string
  companyName: string
  companyUrl: string
}

export default function DeleteLogoDialog({
  logo,
  setDeleteLogo,
  getData,
}: {
  logo: Logo
  setDeleteLogo: (logo: Logo | null) => void
  getData: () => void
}) {
  const handleDelete = () => {
    deleteLogoFromLoop(logo.id)
      .then(() => {
        toast.success("Logo deleted successfully")
        setDeleteLogo(null)
      })
      .catch((error) => {
        console.error("Error deleting logo from loop:", error)
        toast.error("Failed to delete logo from loop")
      })
      .finally(() => {
        getData()
      })
  }

  return (
    <Dialog open={true} onOpenChange={() => setDeleteLogo(null)}>
      <DialogContent>
        <div>
          <h2>Are you sure you want to delete this logo?</h2>
          <Image
            src={logo.logoUrl}
            alt={logo.companyName}
            width={100}
            height={100}
            className="my-4"
          />
          <div className="mt-3 flex flex-row gap-2">
            <button
              onClick={handleDelete}
              className="cursor-pointer rounded bg-destructive px-3 py-2 hover:bg-destructive/80"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => {
                toast("Deletion cancelled")
                setDeleteLogo(null)
              }}
              className="cursor-pointer rounded bg-secondary px-3 py-2 hover:bg-secondary/80"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
