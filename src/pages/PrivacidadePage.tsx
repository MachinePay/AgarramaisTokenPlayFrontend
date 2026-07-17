import { Link } from "react-router-dom";

export function PrivacidadePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 bg-white px-5 py-8 text-brand-black">
      <Link to="/entrar" className="text-sm font-black text-orange-700">
        Voltar
      </Link>
      <section className="rounded-3xl bg-amber-50 p-5">
        <p className="text-xs font-black uppercase text-orange-700">Versao 2026-07-17</p>
        <h1 className="mt-2 text-3xl font-black">Politica de Privacidade</h1>
        <p className="mt-3 text-sm font-semibold text-gray-600">
          Esta politica explica, de forma resumida, como o Agarra Mais trata dados pessoais para operar contas,
          fichas, jogadas, pedidos, atendimento e pagamentos.
        </p>
      </section>

      <PolicySection title="Dados coletados">
        Coletamos nome, e-mail, CPF, telefone quando informado, senha protegida por hash, saldo de fichas, pontos,
        historico de compras, pedidos, lojas favoritas e jogadas. Pagamentos sao processados por provedor externo;
        o app nao deve armazenar dados completos de cartao.
      </PolicySection>

      <PolicySection title="Finalidades">
        Usamos os dados para criar e proteger a conta, autenticar acesso, entregar fichas e produtos, registrar
        transacoes, prevenir fraude, prestar suporte, cumprir obrigacoes legais e melhorar a operacao das maquinas.
      </PolicySection>

      <PolicySection title="Compartilhamento">
        Dados necessarios para pagamento podem ser enviados ao provedor de pagamento. Dados de operacao podem ser
        acessados por administradores autorizados e fornecedores tecnicos que atuem para manter o servico.
      </PolicySection>

      <PolicySection title="Direitos do titular">
        Voce pode pedir confirmacao de tratamento, acesso, correcao, portabilidade, informacao sobre compartilhamento,
        revogacao do consentimento e eliminacao quando aplicavel. Solicite pelo canal de atendimento informado pela
        empresa operadora do Agarra Mais.
      </PolicySection>

      <PolicySection title="Seguranca e retencao">
        Mantemos controles de acesso, autenticacao por token e senhas em formato protegido. Dados sao retidos pelo
        tempo necessario para operar a conta, cumprir obrigacoes legais e resolver disputas.
      </PolicySection>
    </main>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">{children}</p>
    </section>
  );
}
