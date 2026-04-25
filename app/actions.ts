"use server"

export async function getConnections() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/connect`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    return response.json()
  } catch (error) {
    console.error("Error fetching connections:", error)
    throw error
  }
}

export async function initiateConnection(data: any) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to initiate connection")
    }

    return response.json()
  } catch (error) {
    console.error("Error initiating connection:", error)
    throw error
  }
}
