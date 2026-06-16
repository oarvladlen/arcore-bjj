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
    coach: 'Anthony Depadua',
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

  // Professor: link secreto ?mestre=SENHA (nunca use ?password= — colide com login)
  coach: {
    gate: 'mestre',
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

  // Grade horária fixa. weekday = seg–sex, saturday = sábado, domingo = folga.
  schedule: {
    weekday: [
      { time: '12:15', label: 'Treino' },
      { time: '16:00', label: 'Treino' },
      { time: '17:00', label: 'Treino' },
      { time: '18:00', label: 'Treino' },
      { time: '19:00', label: 'Kids', kids: true },
      { time: '20:00', label: 'Treino' },
    ],
    saturday: [
      { time: '11:00', label: 'Treino' },
    ],
  },
};
