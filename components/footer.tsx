"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t py-4 mt-auto">
      <div className="container flex justify-center items-center text-sm text-muted-foreground">
        Built by Vlad - Find me on X{" "}
        <Link
          href="https://x.com/deifosv"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-medium text-primary hover:underline"
        >
          @deifosv
        </Link>
      </div>
    </footer>
  );
}
