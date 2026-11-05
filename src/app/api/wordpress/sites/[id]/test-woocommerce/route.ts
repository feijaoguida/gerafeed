import { NextResponse } from "next/server";
import { getSessionWorkspaceId } from "@/lib/workspace";
import { getWordPressSiteConfig } from "@/lib/wordpress-sites";
import { BillingService, AFFILIATE_FEATURES } from "@/lib/billing";
import { handleApiError } from "@/lib/errors/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = await getSessionWorkspaceId();

    // Validar se o workspace tem acesso ao módulo de afiliados
    await BillingService.assertFeature(
      workspaceId,
      AFFILIATE_FEATURES.MODULE,
      "O teste de conexão WooCommerce requer o módulo de Afiliados ativo no plano."
    );

    const config = await getWordPressSiteConfig(workspaceId, id);
    if (!config) {
      return NextResponse.json(
        { error: "Site WordPress não encontrado no Workspace." },
        { status: 404 }
      );
    }

    if (!config.url) {
      return NextResponse.json(
        { error: "A URL do WordPress não está configurada." },
        { status: 400 }
      );
    }

    let authHeader = "";
    let authType: "consumer_keys" | "application_password" = "consumer_keys";

    if (config.woocommerceConsumerKey && config.woocommerceConsumerSecret) {
      const creds = `${config.woocommerceConsumerKey}:${config.woocommerceConsumerSecret}`;
      authHeader = `Basic ${Buffer.from(creds).toString("base64")}`;
      authType = "consumer_keys";
    } else if (config.username && config.applicationPassword) {
      const creds = `${config.username}:${config.applicationPassword}`;
      authHeader = `Basic ${Buffer.from(creds).toString("base64")}`;
      authType = "application_password";
    } else {
      return NextResponse.json(
        {
          error:
            "Credenciais incompletas. Informe o Consumer Key e Consumer Secret do WooCommerce, ou o Usuário e Application Password do WordPress.",
        },
        { status: 400 }
      );
    }

    // Primeiro tenta o endpoint de system_status
    let res = await fetch(`${config.url}/wp-json/wc/v3/system_status`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // Se der 403 em system_status, tenta listar produtos (per_page=1), pois requer menos privilégios
    if (res.status === 403) {
      res = await fetch(`${config.url}/wp-json/wc/v3/products?per_page=1`, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error(
        `Erro WooCommerce no teste [${res.status} ${res.statusText}]:`,
        errorText.substring(0, 500)
      );

      let userFriendlyMessage = "Erro desconhecido ao acessar a REST API do WooCommerce.";
      if (res.status === 401) {
        userFriendlyMessage =
          "Credenciais inválidas ou sem autorização na REST API do WooCommerce. Verifique se o Consumer Key (ck_...) e Consumer Secret (cs_...) estão corretos e têm permissão de Leitura/Escrita.";
      } else if (res.status === 404) {
        userFriendlyMessage =
          "A API REST do WooCommerce (/wp-json/wc/v3/) não foi encontrada. Verifique se o plugin WooCommerce está ativo e se os Links Permanentes do WordPress estão ativados (não utilize a opção 'Simples').";
      } else if (res.status === 403) {
        userFriendlyMessage =
          "Acesso negado à API do WooCommerce. Verifique se o usuário da chave possui privilégios de Administrador ou Gerente da Loja (Shop Manager).";
      }

      return NextResponse.json(
        {
          error: `Falha na conexão com WooCommerce (${res.status}): ${userFriendlyMessage}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: true,
      authType,
      message: "Conexão com a WooCommerce REST API realizada com sucesso!",
    });
  } catch (error: unknown) {
    const { id } = await params;
    return handleApiError(error, request, {
      module: "WORDPRESS",
      screen: "Sites WordPress / Teste WooCommerce",
      query: { wordpressSiteId: id },
      userFacingMessage: "Erro ao testar conexão com o WooCommerce.",
    });
  }
}

