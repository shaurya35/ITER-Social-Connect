"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/explore";
  }, []);

  return <div>Redirecting to explore page...</div>;
}
