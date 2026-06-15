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
    url: '',       // https://xxxxxxxx.supabase.co
    anonKey: '',   // eyJhbGciOi...
  },

  // Auth: ativo automaticamente quando supabase está configurado.
  // enabled: false força modo demo mesmo com Supabase (só dev).
  auth: {
    enabled: false,
    redirectUrl: '',  // ex.: https://arcore.netlify.app/ (opcional)
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
