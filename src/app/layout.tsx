import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ProveedorTema } from "@/components/layout/proveedor-tema";
import { ProveedorToast } from "@/components/ui/toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GROWICMS",
  description: "CMS de comercio electronico potente y flexible",
  icons: {
    icon: "/g-icon.svg",
  },
};

export default function RaizLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="modo-oscuro" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('growicms-tema');var d=document.documentElement;if(t==='claro'){d.classList.remove('modo-oscuro')}else{d.classList.add('modo-oscuro')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <ProveedorTema>
          <ProveedorToast>
            {children}
          </ProveedorToast>
        </ProveedorTema>
      </body>
    </html>
  );
}
