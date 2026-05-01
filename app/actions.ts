"use server"

export async function registerUser(data: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/createUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to register user")
    }
    return response.json()
  }
  catch (error) {
    console.error("Error registering user:", error)
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

export async function getUserInCollection(user_id: string) {
  try {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/getUserInCollection?user_id=${user_id}`,
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

export async function getConnections(user_id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/connect?id=${user_id}`,
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

    const responseData = await response.json()
    if (!response.ok) {
      throw new Error(responseData.error)
    }

    return responseData
  } catch (error) {
    console.error("Error initiating connection:", error)
    throw error
  }
}
