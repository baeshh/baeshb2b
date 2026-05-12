import { NextResponse } from "next/server";
import { HttpError } from "@/lib/program-access";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof HttpError) {
    return jsonError(err.message, err.status);
  }
  console.error(err);
  if (process.env.NODE_ENV === "development" && err instanceof Error && err.message) {
    return jsonError(`Internal server error: ${err.message}`, 500);
  }
  return jsonError("Internal server error", 500);
}
