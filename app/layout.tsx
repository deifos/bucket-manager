import type React from "react";
import "@/app/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarProvider } from "@/components/sidebar-context";
import { SidebarWithContext } from "@/components/sidebar-with-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AppSidebarProvider>
            <SidebarProvider>
              <SidebarWithContext />
              <SidebarTrigger />

              <main>{children}</main>
            </SidebarProvider>
          </AppSidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
