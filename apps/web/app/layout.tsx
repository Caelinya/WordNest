import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/providers";
import { cookies } from "next/headers";
import { User } from "@/types/notes";
import AppLayout from "@/components/layouts/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WordNest",
  description: "Your Knowledge Base",
  icons: {
    icon: [
      {
        url: "/logo-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/logo-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

async function getUser(token: string | undefined): Promise<User | null> {
    const baseUrl = process.env.INTERNAL_API_URL;

    if (!token || !baseUrl) {
        return null;
    }

    try {
        const res = await fetch(`${baseUrl}/auth/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store', // Ensure we always get the latest user data
        });

        if (res.ok) {
            const user = await res.json();
            return user;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch user on server:", error);
        return null;
    }
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getUser(token);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers user={user}>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
