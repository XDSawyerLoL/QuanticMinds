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
