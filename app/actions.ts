"use server"

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const errorData = await response.json()
    return errorData?.error || fallback
  } catch {
    return fallback
  }
}

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
      return {
        success: false,
        error: await readErrorMessage(response, "Failed to register user"),
      }
    }
    return {
      success: true,
      data: await response.json(),
    }
  }
  catch (error) {
    console.error("Error registering user:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to register user",
    }
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
            return {
              success: false,
              error: await readErrorMessage(response, "Failed to fetch user data"),
            }
    }
        return {
          success: true,
          data: await response.json(),
        }
    } catch (error) {
        console.error("Error fetching user data:", error)
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Failed to fetch user data",
            }
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
            return {
              success: false,
              error: await readErrorMessage(response, "Failed to fetch user data"),
            }
    }
        return {
          success: true,
          data: await response.json(),
        }
    } catch (error) {
        console.error("Error fetching user data:", error)
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Failed to fetch user data",
            }
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
    if (!response.ok) {
      return {
        success: false,
        error: await readErrorMessage(response, "Failed to fetch connections"),
      }
    }

    const responseData = await response.json()

    return {
      success: true,
      data: responseData.data || [],
    }
  } catch (error) {
    console.error("Error fetching connections:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch connections",
    }
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
      return {
        success: false,
        error: responseData.error || "Failed to initiate connection",
      }
    }

    return {
      success: true,
      data: responseData,
    }
  } catch (error) {
    console.error("Error initiating connection:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initiate connection",
    }
  }
}

export async function sendOTP(
  email: string,
  firstName: string,
  lastName: string,
  course: string,
  resend = false
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sendOTP`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, firstName, lastName, course, resend }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: await readErrorMessage(response, "Failed to send OTP"),
      }
    }
    return {
      success: true,
      data: await response.json(),
    }
  } catch (error) {
    console.error("Error sending OTP:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send OTP",
    }
  }
}

export async function verifyOTP(email: string, otp: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/verifyOTP`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: await readErrorMessage(response, "Failed to verify OTP"),
      }
    }
    return {
      success: true,
      data: await response.json(),
    }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify OTP",
    }
  }
}

export async function completeSignup(email: string, shortBio: string, socialLinks: string[], portfolioLink: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/completeSignup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, shortBio, socialLinks, portfolioLink }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: await readErrorMessage(response, "Failed to complete signup"),
      }
    }
    return {
      success: true,
      data: await response.json(),
    }
  } catch (error) {
    console.error("Error completing signup:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete signup",
    }
  }
}
