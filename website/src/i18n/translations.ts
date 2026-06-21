export type Lang = "fr" | "en"

export interface Translation {
  lang: Lang
  altLang: Lang
  altLangLabel: string
  altLangUrl: string
  canonicalPath: string

  badge: string
  heroTitle: string
  heroEm: string
  heroRest: string
  heroSub: string
  heroCta: string
  scrollHint: string

  audienceTitle: string
  audience: { emoji: string; label: string }[]

  problemsTitle: string
  problems: { emoji: string; title: string; text: string }[]

  labelChaos: string
  labelClean: string
  channelName: string
  dayMonday: string
  dayTuesday: string

  bridgeTitle: string
  bridgeSub: string

  benefitsTitle: string
  benefits: { emoji: string; title: string; text: string; brands?: string[] }[]

  compatTitle: string
  compatSub: string
  compatYes: { name: string; reason: string }[]
  compatNo: { name: string; reason: string }[]

  roadmapTitle: string
  roadmapSub: string
  roadmapItems: { emoji: string; title: string; text: string; soon?: boolean }[]

  clubBannerText: string
  clubBannerCta: string

  ctaTitle: string
  ctaSub: string
  ctaInstall: string
  ctaGithub: string

  chaosMessages: {
    author: string
    color: string
    textColor: string
    initial: string
    time: string
    text: string
  }[]

  typingChaos: string
  typingClean: string

  commandMsg: string
  embedEyebrow: string
  embedTitle: string
  embedFields: { name: string; value: string }[]
  embedParticipants: string
  embedFooter: string
  btnJoin: string
  btnLeave: string

  cleanMessages: {
    author: string
    color: string
    textColor: string
    initial: string
    time: string
    text: string
    addsChip?: { color: string; initial: string; name: string }
  }[]
}

const chaosMessagesFr: Translation["chaosMessages"] = [
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:32",
    text: "Sortie samedi ? Je pars à 8h du parking Leclerc 🚴",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:33",
    text: "Je suis dispo ! C'est quoi la trace ?",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:35",
    text: "8h c'est bon pour moi",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:36",
    text: "Moi aussi mais plutôt 9h, j'ai les enfants le matin",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:37",
    text: "On avait dit 8h non ?",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:38",
    text: "Moi je roule dimanche en fait, désolée 😅",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:39",
    text: "Au fait j'ai un vélo à vendre si quelqu'un cherche 😄",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:39",
    text: "Oh c'est quoi comme vélo ?",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:40",
    text: "Trek Domane 2021, 105 hydraulique, quasi neuf",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:40",
    text: "T'en veux combien ?",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:42",
    text: "Les gars c'est samedi ou pas ?? 😅",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:43",
    text: "Finalement je peux samedi en fait !",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:43",
    text: "C'est quoi la distance ?",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:44",
    text: "Quel niveau ? Je veux pas crever comme la dernière fois 💀",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:45",
    text: "2200€, je peux descendre un peu",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:45",
    text: "T'as des photos ?",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:46",
    text: "Au fait, quelqu'un pour une sortie dimanche aussi ? Pour ceux qui peuvent pas samedi 🙋",
  },
  {
    author: "Sophie",
    color: "#9B59B6",
    textColor: "#c39ee8",
    initial: "S",
    time: "14:46",
    text: "Dimanche oui ! Quelle distance tu prévois ?",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:47",
    text: "Attendez c'est quoi le plan, samedi ou dimanche ??",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:47",
    text: "@tous alors c'est confirmé samedi 8h ??",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:47",
    text: "9h pour moi c'est mieux vraiment",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:48",
    text: "Je préfère 8h30 ?",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:50",
    text: "Ok 8h30 on dit ? 🤞",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "07:12",
    text: "@tous les gars c'est quoi déjà le point de rdv ? 😅",
  },
]

const chaosMessagesEn: Translation["chaosMessages"] = [
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:32",
    text: "Ride on Saturday? Leaving at 8am from the Leclerc car park 🚴",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:33",
    text: "I'm in! What's the route?",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:35",
    text: "8am works for me",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:36",
    text: "Same but 9am would be better, I have the kids in the morning",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:37",
    text: "Didn't we say 8am?",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:38",
    text: "Actually I'm riding Sunday, sorry 😅",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:39",
    text: "By the way I have a bike to sell if anyone's interested 😄",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:39",
    text: "Oh what bike?",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:40",
    text: "Trek Domane 2021, 105 hydraulic, basically new",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:40",
    text: "How much do you want?",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:42",
    text: "Guys is it Saturday or not?? 😅",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:43",
    text: "Actually I can do Saturday!",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:43",
    text: "What's the distance?",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:44",
    text: "What level? I don't want to die like last time 💀",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:45",
    text: "2200€, I can go a bit lower",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:45",
    text: "You got photos?",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:46",
    text: "By the way, anyone for a Sunday ride too? For those who can't make Saturday 🙋",
  },
  {
    author: "Sophie",
    color: "#9B59B6",
    textColor: "#c39ee8",
    initial: "S",
    time: "14:46",
    text: "Sunday yes! What distance are you thinking?",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:47",
    text: "Wait, what's the plan, Saturday or Sunday??",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:47",
    text: "@everyone so confirmed Saturday 8am??",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:47",
    text: "9am would really be better for me",
  },
  {
    author: "Julie",
    color: "#EB459E",
    textColor: "#f47bbf",
    initial: "J",
    time: "14:48",
    text: "I'd prefer 8:30?",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:50",
    text: "Ok 8:30 then? 🤞",
  },
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "07:12",
    text: "@everyone guys what's the meeting point again? 😅",
  },
]

const cleanMessagesFr: Translation["cleanMessages"] = [
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:32",
    text: "/newride",
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:32",
    text: "__embed__",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:34",
    text: "Top ! 🙌",
    addsChip: { color: "#3BA55C", initial: "M", name: "Marc" },
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:34",
    text: "Marc a rejoint la sortie ! (2 participants)",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:36",
    text: "Je suis là 💪",
    addsChip: { color: "#FAA61A", initial: "T", name: "Thomas" },
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:36",
    text: "Thomas a rejoint la sortie ! (3 participants)",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:37",
    text: "J'arrive même si c'est 8h30 😤",
    addsChip: { color: "#ED4245", initial: "K", name: "Kevin" },
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:37",
    text: "Kevin a rejoint la sortie ! (4 participants)",
  },
]

const cleanMessagesEn: Translation["cleanMessages"] = [
  {
    author: "Pierre",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "P",
    time: "14:32",
    text: "/newride",
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:32",
    text: "__embed__",
  },
  {
    author: "Marc",
    color: "#3BA55C",
    textColor: "#57f287",
    initial: "M",
    time: "14:34",
    text: "Nice! 🙌",
    addsChip: { color: "#3BA55C", initial: "M", name: "Marc" },
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:34",
    text: "Marc joined the ride! (2 participants)",
  },
  {
    author: "Thomas",
    color: "#FAA61A",
    textColor: "#fee75c",
    initial: "T",
    time: "14:36",
    text: "I'm in 💪",
    addsChip: { color: "#FAA61A", initial: "T", name: "Thomas" },
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:36",
    text: "Thomas joined the ride! (3 participants)",
  },
  {
    author: "Kevin",
    color: "#ED4245",
    textColor: "#ed4245",
    initial: "K",
    time: "14:37",
    text: "I'll be there even at 8:30 😤",
    addsChip: { color: "#ED4245", initial: "K", name: "Kevin" },
  },
  {
    author: "group-ride",
    color: "#5865F2",
    textColor: "#a8b3f8",
    initial: "🤖",
    time: "14:37",
    text: "Kevin joined the ride! (4 participants)",
  },
]

export const t: Record<Lang, Translation> = {
  fr: {
    lang: "fr",
    altLang: "en",
    altLangLabel: "English",
    altLangUrl: "/en/",
    canonicalPath: "",

    badge: "Bot Discord & Telegram · open-source",
    heroTitle: "Fini le",
    heroEm: "bazar",
    heroRest: "dans votre groupe vélo",
    heroSub:
      "Une commande remplace 40 messages. group-ride annonce la sortie, gère la liste des participants et envoie les rappels automatiquement — sur Discord et Telegram. Gratuit et auto-hébergé.",
    heroCta: "Démarrer en 5 minutes",
    scrollHint: "Faites défiler",

    audienceTitle: "Pour qui ?",
    audience: [
      { emoji: "🚴", label: "Clubs amateurs" },
      { emoji: "👥", label: "Groupes d'amis" },
      { emoji: "🏅", label: "Associations sportives" },
      { emoji: "📅", label: "Sorties régulières" },
    ],

    problemsTitle: "Ça vous parle ?",
    problems: [
      {
        emoji: "💬",
        title: "Les détails se perdent",
        text: "Heure, point de rdv, niveau, trace… tout se noie sous 40 messages hors-sujet.",
      },
      {
        emoji: "🤷",
        title: "Impossible de savoir qui vient",
        text: "Les « je serai là » se font oublier et personne ne sait combien de personnes attendre.",
      },
      {
        emoji: "📢",
        title: "Le @tous qui réveille tout le monde",
        text: "À 7h du matin, pour rappeler un détail que la moitié a déjà oublié.",
      },
      {
        emoji: "🔄",
        title: "Les mêmes questions à chaque fois",
        text: "« C'est quoi déjà le point de rdv ? » « On part à quelle heure ? » À chaque sortie.",
      },
    ],

    labelChaos: "Sans group-ride",
    labelClean: "Avec group-ride",
    channelName: "sorties",
    dayMonday: "Lundi",
    dayTuesday: "Mardi",

    bridgeTitle: "Et si le bot s'en chargeait ?",
    bridgeSub: "Une commande, tout est organisé. Automatiquement.",

    clubBannerText: "Vous êtes un club et souhaitez déployer une instance dédiée ?",
    clubBannerCta: "Parlons-en",

    ctaTitle: "Prêt à reprendre le contrôle ?",
    ctaSub: "Open-source · Discord & Telegram · Auto-hébergé",
    ctaInstall: "Guide d'installation",
    ctaGithub: "Voir sur GitHub",

    chaosMessages: chaosMessagesFr,
    typingChaos: "Marie est en train d'écrire…",
    typingClean: "group-ride est en train d'écrire…",

    commandMsg: "/newride",
    embedEyebrow: "🚴 Nouvelle sortie proposée",
    embedTitle: "Boucle des Crêtes — Samedi 31 mai",
    embedFields: [
      { name: "⏰ Départ", value: "8h30" },
      { name: "📍 Rendez-vous", value: "Parking Leclerc" },
      { name: "📏 Distance", value: "80 km · 900 m D+" },
      { name: "💪 Niveau", value: "Intermédiaire" },
      { name: "🗺️ Trace", value: "Voir sur Komoot →" },
    ],
    embedParticipants: "👥 Participants",
    embedFooter: "Géré par group-ride · Thread dédié créé ↗",
    btnJoin: "✅ Participer",
    btnLeave: "❌ Me désister",

    cleanMessages: cleanMessagesFr,

    benefitsTitle: "Ce que ça change",
    benefits: [
      {
        emoji: "📋",
        title: "Une annonce claire dès le départ",
        text: "Date, heure, lieu, distance, niveau et trace Komoot/Strava en un seul message structuré.",
      },
      {
        emoji: "👥",
        title: "La liste des participants en temps réel",
        text: "Un bouton « Participer », et tout le monde voit qui vient. Plus d'ambiguïté.",
      },
      {
        emoji: "🧵",
        title: "Un thread dédié par sortie",
        text: "Les questions de détails restent dans leur fil. Le channel principal ne se transforme plus en bazar.",
      },
      {
        emoji: "⏰",
        title: "Rappels automatiques",
        text: "Le bot notifie les participants la veille et le matin de la sortie. Personne ne l'oublie.",
      },
      {
        emoji: "🔒",
        title: "Vos données restent chez vous",
        text: "Open-source et auto-hébergé. Pas de compte tiers, pas de SaaS, pas de dépendance.",
      },
      {
        emoji: "🗺️",
        title: "Komoot et Strava intégrés",
        text: "Collez un lien Komoot ou Strava, le bot importe automatiquement distance, dénivelé et titre.",
        brands: ["komoot", "strava", "garmin"],
      },
    ],

    roadmapTitle: "Ce qui arrive bientôt",
    roadmapSub: "group-ride est en développement actif. Voici ce qui est prévu.",
    roadmapItems: [
      {
        emoji: "🖱️",
        title: "Installer le bot en 2 clics",
        text: "Un site web pour enregistrer group-ride sur votre serveur Discord sans toucher à une ligne de config.",
        soon: true,
      },
      {
        emoji: "📅",
        title: "Sorties récurrentes",
        text: "Planifiez une sortie hebdomadaire et laissez le bot créer l'annonce automatiquement chaque semaine.",
      },
      {
        emoji: "📊",
        title: "Statistiques du club",
        text: "Nombre de sorties, participants les plus assidus, distance cumulée — un tableau de bord pour votre club.",
      },
      {
        emoji: "📆",
        title: "Intégration calendrier",
        text: "Exportez les sorties confirmées en iCal pour les avoir directement dans Google Calendar ou Apple Calendar.",
      },
    ],

    compatTitle: "Sur quelle plateforme ?",
    compatSub:
      "group-ride tourne sur Discord et Telegram. Pas sur WhatsApp ni Signal — voici pourquoi.",
    compatYes: [
      {
        name: "Discord",
        reason:
          "API officielle complète avec bots, threads, boutons interactifs et webhooks. Exactement ce qu'il faut pour structurer des sorties.",
      },
      {
        name: "Telegram",
        reason:
          "API Bot publique et stable, sans limite artificielle. Les bots sont un citoyen de première classe sur Telegram.",
      },
    ],
    compatNo: [
      {
        name: "WhatsApp",
        reason:
          "Pas d'API bot officielle pour les groupes. L'API Business est limitée aux entreprises et ne permet pas d'interactions temps réel dans un groupe. Toute intégration non officielle viole les CGU et peut mener à un ban.",
      },
      {
        name: "Signal",
        reason:
          "Conçu intentionnellement sans API tierce pour préserver la vie privée. C'est un choix architectural, pas un oubli — et c'est une bonne chose.",
      },
    ],
  },

  en: {
    lang: "en",
    altLang: "fr",
    altLangLabel: "Français",
    altLangUrl: "/",
    canonicalPath: "en/",

    badge: "Discord & Telegram Bot · open-source",
    heroTitle: "No more",
    heroEm: "chaos",
    heroRest: "in your cycling group",
    heroSub:
      "One command replaces 40 messages. group-ride announces the ride, manages the participant list, and sends reminders automatically — on Discord and Telegram. Free and self-hosted.",
    heroCta: "Get started in 5 minutes",
    scrollHint: "Scroll down",

    audienceTitle: "Who is it for?",
    audience: [
      { emoji: "🚴", label: "Amateur clubs" },
      { emoji: "👥", label: "Friend groups" },
      { emoji: "🏅", label: "Sports associations" },
      { emoji: "📅", label: "Regular rides" },
    ],

    problemsTitle: "Sound familiar?",
    problems: [
      {
        emoji: "💬",
        title: "Details get lost in the flood",
        text: "Time, meeting point, level, route… buried under 40 off-topic messages.",
      },
      {
        emoji: "🤷",
        title: "No one knows who's coming",
        text: 'The "I\'ll be there" messages are quickly forgotten and nobody knows how many riders to expect.',
      },
      {
        emoji: "📢",
        title: "The @everyone that wakes everyone up",
        text: "At 7am, to remind everyone of a detail half of them already forgot.",
      },
      {
        emoji: "🔄",
        title: "Same questions every single time",
        text: '"What\'s the meeting point again?" "What time are we leaving?" Every. Single. Ride.',
      },
    ],

    labelChaos: "Without group-ride",
    labelClean: "With group-ride",
    channelName: "rides",
    dayMonday: "Monday",
    dayTuesday: "Tuesday",

    bridgeTitle: "What if the bot handled it?",
    bridgeSub: "One command, everything is organised. Automatically.",

    clubBannerText: "Running a club and want to deploy a dedicated bot instance?",
    clubBannerCta: "Let's talk",

    ctaTitle: "Ready to take back control?",
    ctaSub: "Open-source · Discord & Telegram · Self-hosted",
    ctaInstall: "Installation guide",
    ctaGithub: "View on GitHub",

    chaosMessages: chaosMessagesEn,
    typingChaos: "Marie is typing…",
    typingClean: "group-ride is typing…",

    commandMsg: "/newride",
    embedEyebrow: "🚴 New ride proposed",
    embedTitle: "Ridge Loop — Saturday May 31",
    embedFields: [
      { name: "⏰ Departure", value: "8:30am" },
      { name: "📍 Meeting point", value: "Leclerc car park" },
      { name: "📏 Distance", value: "80 km · 900 m climb" },
      { name: "💪 Level", value: "Intermediate" },
      { name: "🗺️ Route", value: "View on Komoot →" },
    ],
    embedParticipants: "👥 Participants",
    embedFooter: "Managed by group-ride · Dedicated thread created ↗",
    btnJoin: "✅ Join",
    btnLeave: "❌ Drop out",

    cleanMessages: cleanMessagesEn,

    benefitsTitle: "What changes",
    benefits: [
      {
        emoji: "📋",
        title: "One clear announcement",
        text: "Date, time, meeting point, distance, level and Komoot/Strava route in a single structured message.",
      },
      {
        emoji: "👥",
        title: "Live participant list",
        text: 'One "Join" button and everyone can see who\'s coming. No more ambiguity.',
      },
      {
        emoji: "🧵",
        title: "A dedicated thread per ride",
        text: "Detail questions stay in their own thread. The main channel never turns into a mess.",
      },
      {
        emoji: "⏰",
        title: "Automatic reminders",
        text: "The bot notifies participants the day before and the morning of the ride. Nobody forgets.",
      },
      {
        emoji: "🔒",
        title: "Your data stays with you",
        text: "Open-source and self-hosted. No third-party account, no SaaS, no dependency.",
      },
      {
        emoji: "🗺️",
        title: "Komoot & Strava built-in",
        text: "Paste a Komoot or Strava link and the bot automatically imports distance, elevation and title.",
        brands: ["komoot", "strava", "garmin"],
      },
    ],

    roadmapTitle: "Coming soon",
    roadmapSub: "group-ride is actively developed. Here's what's planned.",
    roadmapItems: [
      {
        emoji: "🖱️",
        title: "Add the bot in 2 clicks",
        text: "A web onboarding flow to register group-ride on your Discord server — no config files, no terminal.",
        soon: true,
      },
      {
        emoji: "📅",
        title: "Recurring rides",
        text: "Schedule a weekly ride and let the bot create the announcement automatically every week.",
      },
      {
        emoji: "📊",
        title: "Club statistics",
        text: "Number of rides, most active members, cumulative distance — a dashboard for your club.",
      },
      {
        emoji: "📆",
        title: "Calendar integration",
        text: "Export confirmed rides as iCal to add them directly to Google Calendar or Apple Calendar.",
      },
    ],

    compatTitle: "Which platforms?",
    compatSub: "group-ride runs on Discord and Telegram. Not on WhatsApp or Signal — here's why.",
    compatYes: [
      {
        name: "Discord",
        reason:
          "Full official API with bots, threads, interactive buttons and webhooks. Exactly what's needed to structure rides.",
      },
      {
        name: "Telegram",
        reason:
          "Stable public Bot API with no artificial limits. Bots are first-class citizens on Telegram.",
      },
    ],
    compatNo: [
      {
        name: "WhatsApp",
        reason:
          "No official bot API for groups. The Business API is limited to companies and doesn't support real-time group interactions. Any unofficial integration violates the ToS and risks a ban.",
      },
      {
        name: "Signal",
        reason:
          "Intentionally designed without a third-party API to protect privacy. That's an architectural choice, not an oversight — and it's a good one.",
      },
    ],
  },
}
