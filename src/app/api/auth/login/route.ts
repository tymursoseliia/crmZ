import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Users - you can add more users here
const USERS = [
  { username: "admin", password: "zet2026" },
];

function getUsers(): { username: string; password: string }[] {
  // Also check environment variables for additional users
  const users = [...USERS];

  for (let i = 1; i <= 10; i++) {
    const login = process.env[`USER${i}_LOGIN`];
    const pass = process.env[`USER${i}_PASS`];

    if (login && pass) {
      // Avoid duplicates
      if (!users.find(u => u.username === login)) {
        users.push({ username: login, password: pass });
      }
    }
  }

  return users;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Введите логин и пароль" },
        { status: 400 }
      );
    }

    const users = getUsers();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // Create session token (simple base64 encoded)
    const sessionToken = Buffer.from(
      JSON.stringify({ username, timestamp: Date.now() })
    ).toString("base64");

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
