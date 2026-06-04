import "./globals.css";

export const metadata = {
  title: "CFP | Guarda",
  description: "Home com temperatura, equipe do dia e acesso rapido para a escala de guarda"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
