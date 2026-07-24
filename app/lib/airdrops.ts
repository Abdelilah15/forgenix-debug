import { supabase, supabaseAdmin } from './supabase';

export type AirdropStep = {
  id?: string;
  airdrop_id?: string;
  step_order: number;
  title: string;
  content: string;
};

export type Airdrop = {
  id?: string;
  created_at?: string;
  title: string;
  slug: string;
  logo: string | null;
  description: string | null;
  category: string | null;
  status: string | null;
  raised_funds: string | null;
  investors: string | null;
  minor_score: number | null;
  website: string | null;
  twitter: string | null;
  discord: string | null;
  telegram: string | null;
  steps?: AirdropStep[];
};

export async function getPublicAirdrops() {
  const { data, error } = await supabase
    .from('airdrops')
    .select('id, title, slug, logo, category, status, raised_funds, minor_score')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erreur lors de la récupération des airdrops: ${error.message}`);
  return data;
}

export async function getAirdropBySlug(slug: string): Promise<Airdrop | null> {
  const { data, error } = await supabase
    .from('airdrops')
    .select(`
      *,
      steps:airdrop_steps(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Airdrop non trouvé
    throw new Error(`Erreur lors de la récupération de l'airdrop: ${error.message}`);
  }

  if (data && data.steps) {
    data.steps.sort((a: AirdropStep, b: AirdropStep) => a.step_order - b.step_order);
  }

  return data as Airdrop;
}

export async function createAirdrop(airdropData: Airdrop) {
  const adminClient = supabaseAdmin();
  const { steps, ...airdropFields } = airdropData;

  const { data: newAirdrop, error: airdropError } = await adminClient
    .from('airdrops')
    .insert([airdropFields])
    .select()
    .single();

  if (airdropError) throw new Error(`Erreur de création: ${airdropError.message}`);

  if (steps && steps.length > 0) {
    const stepsToInsert = steps.map((step) => ({
      ...step,
      airdrop_id: newAirdrop.id,
    }));

    const { error: stepsError } = await adminClient
      .from('airdrop_steps')
      .insert(stepsToInsert);

    if (stepsError) throw new Error(`Erreur de création des étapes: ${stepsError.message}`);
  }

  return newAirdrop;
}

export async function updateAirdrop(id: string, airdropData: Airdrop) {
  const adminClient = supabaseAdmin();
  const { steps, id: _, created_at, ...airdropFields } = airdropData;

  const { error: airdropError } = await adminClient
    .from('airdrops')
    .update(airdropFields)
    .eq('id', id);

  if (airdropError) throw new Error(`Erreur de mise à jour: ${airdropError.message}`);

  if (steps) {
    await adminClient.from('airdrop_steps').delete().eq('airdrop_id', id);

    if (steps.length > 0) {
      const stepsToInsert = steps.map((step) => ({
        airdrop_id: id,
        step_order: step.step_order,
        title: step.title,
        content: step.content,
      }));

      const { error: stepsError } = await adminClient
        .from('airdrop_steps')
        .insert(stepsToInsert);

      if (stepsError) throw new Error(`Erreur de mise à jour des étapes: ${stepsError.message}`);
    }
  }

  return true;
}

export async function deleteAirdrop(id: string) {
  const { error } = await supabaseAdmin()
    .from('airdrops')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erreur de suppression: ${error.message}`);
  return true;
}
