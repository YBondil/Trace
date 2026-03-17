# Contexte du Projet : App de Journal Intime (iOS via Web Tech)

## Description Générale
L'objectif est de développer une application iOS à usage strictement personnel (non commercial). C'est un journal intime reprenant les mécaniques de "BeReal" : l'utilisateur est invité chaque jour via une notification à écrire un court texte et ajouter une photo pour documenter sa journée. 

## Stack Technique
- Frontend : SolidJS, HTML, CSS (JavaScript/TypeScript).
- Mobile Wrapper : Capacitor (pour l'accès aux API natives comme les notifications et l'appareil photo).
- Backend / Stockage : Architecture Client-Serveur "Maison" (Node.js). 
  - Serveur : Node.js (Express), hébergé gratuitement sur Render.
  - Base de données : PostgreSQL hébergé sur Neon.tech pour stocker le texte et les métadonnées.
  - Stockage Fichiers : Bucket Cloudflare R2 (compatible S3) pour héberger les photos.
  - Sécurité : À venir (système d'authentification pour sécuriser l'accès à l'API et au journal personnel).
  
## Fonctionnalités Principales (MVP)
1. Saisie Journalière : Possibilité d'écrire un texte et d'attacher une photo pour le jour J (avec blocage si déjà rempli).
2. Notifications (Local Notifications) : 
   - Alarme quotidienne pour rappeler de remplir le journal.
   - Option "Snooze" (repousser).
   - Rappel pour remplir les jours précédents manqués (rattrapage).
   - Abandon de la demande de rattrapage après X jours d'inactivité.
3. Exploration :
   - Calendrier visuel affichant les jours correctement remplis.
   - Vue de lecture détaillée, modification et suppression d'un jour passé quelconque.
4. Souvenirs : Affichage d'un module "Il y a un an, jour pour jour" sur l'écran d'accueil si une entrée correspondante existe.

## Ligne Directrice UI/UX
- Thème : Carnet / Calepin intime.
- Atmosphère : Chaleureuse, personnelle, papier, typographies soignées (manuscrites ou classiques type serif). L'interface doit inviter à l'introspection sans être surchargée.

## État actuel du projet
**Phase 3 en cours : Finitions iOS et Sécurité**
- **Terminé :** Architecture Frontend SolidJS (Écran d'accueil et vue Calendrier dynamiques).
- **Terminé :** Backend Node.js/Express avec API REST complète (CRUD) déployé en ligne sur Render.
- **Terminé :** Intégration de la base de données PostgreSQL (Neon) et du stockage Cloud (Cloudflare R2).
- **Terminé :** Encapsulation mobile via Capacitor et déploiement initial réussi sur iPhone via Xcode (App signée et fonctionnelle).
- **En cours / À faire :** - Nettoyage du CSS spécifique à iOS (gestion des "safe areas" pour l'encoche/Dynamic Island).
  - Mise en place du "Coffre-Fort" (Authentification par mot de passe ou biométrie) pour protéger les accès au serveur et à l'application.
- **À suivre :** - Implémentation des Notifications Locales Capacitor.
  - Module "Il y a un an".

## Directives pour l'assistant IA
- Fournir des exemples de code en SolidJS (et non React) avec l'utilisation des hooks spécifiques à SolidJS (createSignal, createEffect, etc.).
- Gérer les accès natifs exclusivement via les plugins officiels ou maintenus par la communauté Capacitor.
- Accompagner le développement du backend Node.js sur mesure, en expliquant étape par étape la mise en place de l'API REST, la connexion à la base de données et l'upload sécurisé d'images (vers Cloudflare R2 / S3).
- Toujours privilégier des bibliothèques légères et optimiser le code pour respecter les limites des offres d'hébergement gratuites.
- Ne pas proposer de solutions BaaS "clé en main" (comme Firebase ou Supabase) car la volonté de l'utilisateur est d'apprendre en codant le serveur de A à Z.
√
