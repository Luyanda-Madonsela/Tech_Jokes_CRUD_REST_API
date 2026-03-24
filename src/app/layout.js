import localFont from "next/font/local";
import "./globals.css";

export const metadata = {
  title: "CRACK-A-GAG - Laugh and Learn Tech",
  description: "Tech jokes and clips community - laugh and learn tech",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
