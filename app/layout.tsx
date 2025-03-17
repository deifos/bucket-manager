import type React from "react";
import "@/app/globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

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
      <head>
        {/* <style
          dangerouslySetInnerHTML={{
            __html: `
          html { color-scheme: light; }
        `,
          }}
        /> */}
      </head>

      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />

            <main>{children}</main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
