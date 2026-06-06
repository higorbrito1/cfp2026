import "./globals.css";

export const metadata = {
  title: "CFP 8 BPM",
  description: "Home com temperatura, equipe do dia e acesso rapido para a escala de guarda"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
