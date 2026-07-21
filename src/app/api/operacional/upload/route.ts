import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

/**
 * POST /api/operacional/upload
 * Upload de imagem para o Storage. Devolve o CAMINHO salvo.
 * NOTA: usa Supabase Storage temporariamente; será reescrito para
 * Cloudflare R2. O client é criado dentro da função (lazy) para não
 * quebrar o build quando as variáveis de ambiente não existem.
 */

const BUCKET = 'evidencias';
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoEmpresa(req);
  if (acesso instanceof Response) return acesso;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, erro: 'Upload indisponível: storage não configurado.' },
      { status: 503 }
    );
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, erro: 'Arquivo ausente (campo "file").' },
        { status: 400 }
      );
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { ok: false, erro: 'Apenas imagens são permitidas.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, erro: 'Imagem acima de 8MB.' },
        { status: 400 }
      );
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const uid = acesso.sessao.uid;
    const path = `${acesso.empresaId}/${uid}/${crypto.randomUUID()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });

    if (error) {
      console.error('[upload] Storage erro:', error);
      return NextResponse.json(
        { ok: false, erro: 'Falha ao salvar imagem.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, path });
  } catch (error: any) {
    console.error('[POST /api/operacional/upload] Erro:', error);
    return NextResponse.json(
      { ok: false, erro: 'Falha no upload.' },
      { status: 500 }
    );
  }
}
