# Ivoir'Académie 🇨🇮

Plateforme éducative intelligente pour les élèves ivoiriens, propulsée par l'IA.

## Fonctionnalités

- 💬 **Chat intelligent** — Pose tes questions et obtiens des explications adaptées à ton niveau
- 📝 **Exercices** — Génération automatique d'exercices avec correction étape par étape
- ✅ **Correction** — Soumets ton travail et reçois une correction détaillée avec une note
- 🧠 **Quiz** — Des quiz interactifs pour tester tes connaissances
- 📚 **Révision** — Fiches de révision et résumés de leçons
- 🎓 **Programme ivoirien** — Basé sur le programme scolaire de Côte d'Ivoire

## Matières

Mathématiques, Français, Physique-Chimie, SVT, Histoire-Géographie, Philosophie, Anglais

## Technologies

- **Frontend** : Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend** : Next.js API Routes
- **Base de données** : SQLite (dev) / PostgreSQL (prod) avec Prisma ORM
- **IA** : API OpenAI (GPT-4o-mini)
- **Auth** : NextAuth.js

## Installation

```bash
# Cloner le repo
git clone https://github.com/Ralldeur/ivoir-academie.git
cd ivoir-academie

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Modifier .env avec votre clé API OpenAI

# Initialiser la base de données
npx prisma db push
npm run db:seed

# Lancer le serveur de développement
npm run dev
```

## Comptes de démonstration

- **Admin** : admin@ivoir-academie.ci / admin123
- **Élève** : eleve@ivoir-academie.ci / eleve123

## Structure du projet

```
src/
├── app/
│   ├── (auth)/          # Pages de connexion/inscription
│   ├── chat/            # Interface de chat IA
│   ├── exercises/       # Générateur d'exercices
│   ├── admin/           # Panel d'administration
│   └── api/             # Routes API
├── components/
│   ├── chat/            # Composants du chat
│   ├── ui/              # Composants UI réutilisables
│   └── Providers.tsx    # Providers (Auth, Theme, Toast)
├── lib/
│   ├── auth.ts          # Configuration NextAuth
│   ├── openai.ts        # Client OpenAI + prompts
│   ├── prisma.ts        # Client Prisma
│   └── utils.ts         # Utilitaires
└── types/               # Types TypeScript
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion à la base de données |
| `NEXTAUTH_SECRET` | Clé secrète NextAuth |
| `NEXTAUTH_URL` | URL de l'application |
| `OPENAI_API_KEY` | Clé API OpenAI |

## Roadmap

- [ ] Upload PDF/images pour analyse
- [ ] Système RAG complet avec embeddings
- [ ] Paiements Mobile Money (Orange, Wave, MTN)
- [ ] Application mobile (React Native)
- [ ] Mode hors ligne
- [ ] Statistiques d'apprentissage détaillées
- [ ] Système de gamification (badges, points)
- [ ] Support multilingue (Français, Anglais, Dioula, Baoulé)

## Licence

MIT
