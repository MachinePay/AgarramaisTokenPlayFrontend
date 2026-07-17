import { Link } from "react-router-dom";

export function TermosPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 bg-white px-5 py-8 text-brand-black">
      <Link to="/entrar" className="text-sm font-black text-orange-700">
        Voltar
      </Link>
      <section className="rounded-3xl bg-amber-50 p-5">
        <p className="text-xs font-black uppercase text-orange-700">Versao 2026-07-17</p>
        <h1 className="mt-2 text-3xl font-black">Termos de Uso</h1>
        <p className="mt-3 text-sm font-semibold text-gray-600">
          Ao usar o Agarra Mais, voce concorda com as regras basicas para compra de fichas, uso das maquinas,
          resgate de produtos e protecao da sua conta.
        </p>
      </section>

      <TermsSection title="Conta e seguranca">
        Informe dados verdadeiros, mantenha sua senha protegida e avise a operacao caso perceba uso indevido da conta.
      </TermsSection>

      <TermsSection title="Fichas, pontos e pagamentos">
        Fichas e pontos sao usados dentro da plataforma. Compras, estornos e pedidos seguem as regras exibidas no app
        e as regras do provedor de pagamento quando houver checkout externo.
      </TermsSection>

      <TermsSection title="Uso adequado">
        E proibido tentar fraudar saldos, maquinas, pagamentos, pedidos ou acessar area administrativa sem autorizacao.
      </TermsSection>

      <TermsSection title="Privacidade">
        O tratamento de dados pessoais segue a Politica de Privacidade e a LGPD. O uso do cadastro depende do aceite
        desses documentos quando exigido no app.
      </TermsSection>
    </main>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">{children}</p>
    </section>
  );
}
