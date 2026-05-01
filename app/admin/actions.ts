"use server"
import { put } from "@vercel/blob"

export async function UploadImageToBlobStorage(file: File, filename: string) {
  // return {url: "https://www.prospace.com"}
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return blob
}

export async function getCollectionData(collection: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/getCollectionData?collection=${collection}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch collection data")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching collection data:", error)
    throw error
  }
}

export async function getUser(user_id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/getUser?user_id=${user_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }
    return response.json()
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error
  }
}

export async function addLogoToLoop(
  companyName: string,
  companyUrl: string,
  logoUrl: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/addLogoToLoop`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyName, companyUrl, logoUrl }),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to add logo to loop")
    }
    return response.json()
  } catch (error) {
    console.error("Error adding logo to loop:", error)
    throw error
  }
}

export async function deleteLogoFromLoop(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/deleteLogoFromLoop?id=${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },  
      }
    )
    if (!response.ok) {
      throw new Error("Failed to delete logo from loop")
    }
    return response.json()
  } catch (error) {
    console.error("Error deleting logo from loop:", error)
    throw error
  }
}

export async function updateLogoInLoop(
  id: string,
  companyName: string,
  companyUrl: string,
  logoUrl: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/updateLogoInLoop`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, companyName, companyUrl, logoUrl }),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to update logo in loop")
    }
    return response.json()
  } catch (error) {
    console.error("Error updating logo in loop:", error)
    throw error
  }
}

export type CompanySocialLink = {
  platform: string
  url: string
}

export type CompanyRecord = {
  imageUrl: string
  name: string
  logoUrl: string
  socialLinks: CompanySocialLink[]
  companyEmail: string
  moderatorEmails: string[]
  description: string
}

export async function addCompanyToCollection(data: CompanyRecord) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/addCompany`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to add company")
    }
    return response.json()
  } catch (error) {
    console.error("Error adding company:", error)
    throw error
  }
}

export async function updateCompanyInCollection(
  id: string,
  data: CompanyRecord
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/updateCompany`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to update company")
    }
    return response.json()
  } catch (error) {
    console.error("Error updating company:", error)
    throw error
  }
}

export async function deleteCompanyFromCollection(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/deleteCompany?id=${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    if (!response.ok) {
      throw new Error("Failed to delete company")
    }
    return response.json()
  } catch (error) {
    console.error("Error deleting company:", error)
    throw error
  }
}