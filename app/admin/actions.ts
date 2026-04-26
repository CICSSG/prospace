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