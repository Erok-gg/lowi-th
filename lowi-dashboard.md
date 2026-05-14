# LOWI Admin Dashboard — Contexte & Specs

## Décisions prises

- **Framework** : Next.js 14 App Router + TypeScript
- **DB / Auth** : Supabase (MCP connecté)
- **Style** : Windows 3.11 modernisé — léger, distinctif, interne
- **Langue** : Anglais uniquement
- **Responsive** : oui — mobile dégradé acceptable pour un outil admin

---

## Stack technique

```
Next.js 14 (App Router)
Supabase (Auth + Postgres + Realtime)
Tailwind CSS
shadcn/ui (composants de base)
Sui SDK (lecture on-chain)
```

---

## Structure des dossiers (sidebar style Windows Explorer)

```
📁 Projects
   └── 📁 Active
   └── 📁 Closed
   └── 📁 Pipeline
📁 Users
   └── 📁 Active Users
   └── 📁 Waitlist
   └── 📁 Manage Permissions
📁 Accounting
   └── 📁 SPV
   └── 📁 Distributions
   └── 📁 Fees
📁 Submissions
   └── 📁 Pending KYC
   └── 📁 Approved
   └── 📁 Rejected
📁 SUI
   └── 📁 Collections
   └── 📁 NFTs
   └── 📁 Transactions
📁 Bin
   └── (fichiers supprimés, rétention 30j)
```

---

## Auth & Accès

### Superadmin
- Compte unique, tous les droits, ne peut pas être supprimé
- Créé au setup initial (seed Supabase)

### Flow signup (waitlist)
1. Utilisateur soumet email sur `/signup`
2. Entrée créée en DB avec statut `pending`
3. Code aléatoire 10 chars alphanum généré → affiché une seule fois
4. Superadmin voit la demande dans `Users > Waitlist`
5. Superadmin accepte → statut `approved`, code lié au compte
6. Superadmin envoie manuellement le code par email
7. Utilisateur se connecte avec email + code (= mot de passe initial)
8. **Force password change** à la première connexion
9. Refus ou inaction → suppression automatique après **30 jours**

### Protection anti-abus signup
- Rate limit : max 3 tentatives / IP / heure (middleware Next.js)
- CAPTCHA si > 2 tentatives échouées
- Honeypot field dans le formulaire
- Email domain blacklist (jetables)

### Logs
- Toute action loggée : signup, accept, reject, login, permission change, delete
- Table `audit_logs` Supabase
- Rétention : 1 an

---

## Système de permissions (ACL)

### Principe
- Par défaut : utilisateur connecté = accès dashboard uniquement, aucun dossier
- Permissions accordées par dossier, propagées aux sous-dossiers (case à cocher parent = sélectionne tout)
- 2 niveaux : `read` / `edit` (edit inclut déplacer + supprimer)

### Table `permissions` (Supabase)
```sql
user_id     uuid
folder_key  text   -- ex: 'projects', 'projects.active', 'users.waitlist'
level       text   -- 'read' | 'edit'
granted_by  uuid
granted_at  timestamp
```

### UI Manage Permissions
- Liste des utilisateurs
- Arbre de dossiers avec cases à cocher (☐ read / ☐ edit)
- Cocher un dossier parent → coche automatiquement tous les sous-dossiers
- Sauvegarde instantanée (optimistic update)

---

## Estimation de build

| Module | Sessions estimées |
|---|---|
| Setup Next.js + Supabase + auth | Session 1 |
| Waitlist + logs + rate limiting | Session 1 |
| Layout Windows 3.11 + sidebar | Session 2 |
| Système ACL + Manage Users | Session 2 |
| Dossier Projects (lecture Sui) | Session 3 |
| Dossier SUI (NFTs, txs) | Session 3 |
| Accounting + Submissions | Session 4 |

**Total estimé : 3-4 sessions Claude Pro (Sonnet)**

---

## Contrats Sui déployés (Testnet)

```
Package ID  : 0x72a0c356bff77d8f652283f996fdfe13c160088b06c758b61a80e012b9b90d8a
Collection  : 0x43c92af105dd976f7a9ed39a76b3f5e55aa949a8fde6e069fb7c575e22d5a6a4
AdminCap    : 0xbe81dba3235d121eb75057523d4a267a5f136dac8470f7bcafc4ec2bc6b16e87
Admin wallet: 0x1b6725c1bf9b2a88d1071c29969a4273566ebabd25dbe6cf0c023b4987aba68a
```

---

## À décider avant session 1

- [ ] Nom de domaine du dashboard (dashboard.lowi.app ?)
- [ ] Projet Supabase à utiliser (existant ou nouveau ?)
- [ ] Email provider pour envoi manuel (Resend / Postmark ?)
