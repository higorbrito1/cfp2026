import "./globals.css";

export const metadata = {
  title: "Escala de Guarda",
  description: "Site para rotacao automatica da escala de guarda do quartel"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
