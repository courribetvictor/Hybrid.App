import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { messages, context } = await req.json()

    const systemPrompt = `Tu es Coach Hybrid, un coach sportif IA bienveillant, motivant et expert en performance multi-sport.
Tu parles uniquement en français, de façon concise et directe — max 3 paragraphes par réponse.
Tu utilises les données réelles de l'athlète pour personnaliser tes conseils.

PROFIL ATHLÈTE :
Activités récentes (10 dernières) :
${context.activities}

Compétences RPG actuelles (0-100) :
${context.skills}

Objectif hebdomadaire : ${context.goal}

RÈGLES :
- Cite les activités réelles pour personnaliser (ex: "après tes 3 séances de muscu cette semaine...")
- Sois factuel sur les skills (ex: "ton endurance à 72 est ton point fort")
- Propose 1 action concrète à chaque réponse
- Reste positif même si l'athlète est peu actif
- Ne mentionne jamais l'interface ou l'application`

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic error: ${err}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text ?? ''

    return new Response(JSON.stringify({ content }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
