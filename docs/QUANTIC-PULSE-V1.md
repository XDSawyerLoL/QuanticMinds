# Quantic Pulse — V1

Quantic Pulse est le réseau social de l'écosystème Quantic Sillage. Quantic Sillage reste la marque groupe.

## Positionnement
Pulse n'est pas conçu comme un clone de X. La V1 doit fournir une place publique simple avec un fil chronologique permanent, un mode Découverte optionnel, des Cercles, des profils pseudonymes et une intégration native avec Quantic News.

## Principes produit
- Fil chronologique accessible en permanence.
- Personnalisation facultative et explicable.
- Pseudonymat autorisé.
- Export des données prévu comme fonction de premier rang.
- Pas de publicité comportementale.
- Architecture compatible avec une future fédération.
- Les liens Quantic News peuvent être partagés sous forme de cartes enrichies.

## Écrans V1
1. Accueil / fil
2. Explorer
3. Cercles
4. Messages
5. Enregistrés
6. Profil
7. Détail d'une publication
8. Paramètres de confidentialité et export

## Modèle de données cible
User(id, handle, displayName, bio, avatarUrl, verificationState, createdAt)
Post(id, authorId, body, visibility, createdAt, replyToId, quotePostId)
Follow(followerId, followingId, createdAt)
Reaction(userId, postId, type, createdAt)
Circle(id, ownerId, name, description, visibility, createdAt)
CircleMember(circleId, userId, role, joinedAt)
Media(id, postId, type, url, altText)
Bookmark(userId, postId, createdAt)
Notification(id, userId, actorId, type, objectId, readAt, createdAt)

## API cible
GET /api/pulse/feed?mode=following|discover
POST /api/pulse/posts
GET /api/pulse/posts/:id
POST /api/pulse/posts/:id/reactions
POST /api/pulse/follows/:userId
GET /api/pulse/circles
POST /api/pulse/circles
GET /api/pulse/profile/:handle
GET /api/pulse/export

## Prototype livré dans cette branche
- Interface responsive.
- Fil de démonstration.
- Bascule Chronologique / Découverte.
- Composer fonctionnel avec localStorage.
- Recherche locale.
- Réaction J'aime.
- Cartes Quantic News.
- Design aligné sur Quantic Sillage.

## Suite
Remplacer localStorage par le stockage serveur, ajouter l'authentification Quantic commune et implémenter les endpoints Pulse sans casser le site public existant.


## Implémentation serveur ajoutée
La V1 n'est plus limitée au localStorage. Le backend Node 22 expose maintenant une API sociale persistante :

- inscription, connexion, sessions Bearer 30 jours ;
- mots de passe dérivés avec scrypt + sel individuel ;
- publications 420 caractères, réponses et citations ;
- likes, reposts et favoris ;
- abonnements et profils ;
- recherche comptes/publications ;
- cercles publics/privés et adhésion ;
- notifications ;
- messages privés ;
- blocage, signalement et limites de débit ;
- export intégral des données d'un compte.

## Persistance
Pulse utilise MySQL lorsque les variables ci-dessous sont présentes. Sans elles, un fichier data/pulse.json est utilisé pour le développement.

PULSE_DB_HOST
PULSE_DB_PORT=3306
PULSE_DB_USER
PULSE_DB_PASSWORD
PULSE_DB_NAME

La table quantic_pulse_store est créée automatiquement au démarrage. La V1 stocke l'état Pulse sous forme JSON transactionnelle dans une ligne MySQL verrouillée pendant les mutations. Ce choix garde le déploiement simple tout en assurant une persistance réelle. Une normalisation SQL pourra être faite lorsque la charge le justifiera.

## Déploiement
Le frontend utilise pulse-config.js et pointe par défaut vers :
https://quanticminds.onrender.com

Le backend accepte par défaut l'origine du frontend Quantic News. Une origine spécifique peut être définie avec :
PULSE_FRONTEND_ORIGIN

## API V1 effective
GET    /api/pulse/health
POST   /api/pulse/auth/register
POST   /api/pulse/auth/login
POST   /api/pulse/auth/logout
GET    /api/pulse/me
PATCH  /api/pulse/me
GET    /api/pulse/feed
POST   /api/pulse/posts
GET    /api/pulse/posts/:id
DELETE /api/pulse/posts/:id
GET    /api/pulse/posts/:id/replies
POST   /api/pulse/posts/:id/like
POST   /api/pulse/posts/:id/repost
POST   /api/pulse/posts/:id/bookmark
GET    /api/pulse/users/:handle
POST   /api/pulse/users/:handle/follow
POST   /api/pulse/users/:handle/block
GET    /api/pulse/search
GET    /api/pulse/circles
POST   /api/pulse/circles
POST   /api/pulse/circles/:id/join
GET    /api/pulse/notifications
POST   /api/pulse/notifications/read
GET    /api/pulse/me/bookmarks
POST   /api/pulse/report
GET    /api/pulse/conversations
POST   /api/pulse/messages
GET    /api/pulse/messages/:handle
GET    /api/pulse/export

## Limites assumées de V1
- pas encore de récupération de mot de passe par email ;
- médias non encore téléversés dans Pulse ;
- cercles privés sans système d'invitation dans cette première version ;
- stockage MySQL V1 transactionnel mais non normalisé pour une très forte charge ;
- pas encore de fédération ActivityPub.
