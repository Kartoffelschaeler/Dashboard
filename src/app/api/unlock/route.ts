import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function passwordsMatch(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;

  if (!dashboardPassword) {
    return NextResponse.json(false, { status: 503 });
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";
    const isValid = passwordsMatch(password, dashboardPassword);

    return NextResponse.json(isValid, { status: isValid ? 200 : 401 });
  } catch {
    return NextResponse.json(false, { status: 400 });
  }
}
