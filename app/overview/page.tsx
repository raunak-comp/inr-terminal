"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Overview() {
  const router = useRouter();
  useEffect(() => router.replace("/markets"), [router]);
  return null;
}
