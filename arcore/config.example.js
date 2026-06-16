/* =========================================================================
   Arcore — configuração
   -------------------------------------------------------------------------
   MODO LOCAL (padrão): url/anonKey em branco → IndexedDB no aparelho.

   MODO PRODUÇÃO: preencha supabase + rode schema.sql + schema-auth.sql.
   No deploy, use scripts/inject-config.mjs com env vars (ver DEPLOY.md).
   ========================================================================= */
window.ARCORE_CONFIG = {
  gym: {
    name: 'ARCORE',
    tagline: 'JIU-JÍTSU · SANTOS',
    coach: 'Mestre Ricardo',
    ember: '#EA5A2C',
    gold: '#D7AA4C',
  },

  supabase: {
    url: '',       // https://xxxx.supabase.co
    anonKey: '',   // sb_publishable_... or legacy eyJ... anon JWT
  },

  // Auth: ativo automaticamente quando supabase está configurado.
  auth: {
    enabled: false,
    redirectUrl: '',
  },

  // Professor: link secreto ?mestre=1 → só senha (e-mail oculto no backend)
  coach: {
    gate: 'mestre',              // https://seu-app/?mestre=1
    email: 'professor@arcore.com',
  },

  rules: {
    xpCheckin: 50,
    xpMicroLesson: 10,
    xpCompeticao: 200,
    classesPerStripe: 30,
    atRiskDays: 10,
    streakFreezeOnInjury: true,
  },
};
