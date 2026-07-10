import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Page Not Found | Equus",
  robots: "noindex, nofollow",
};

export default function CatchAllPage() {
  notFound();
}
