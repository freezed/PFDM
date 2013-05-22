PFDM
====

__PFDM__ permet de mettre à disposition des mediums facilement, *sans base de données*.
Les medium supporté sont ceux que le navigateur web du client supporte nativement, soit la plupart des images (jpg, png, etc.), des videos (via la balise éponyme HTML5), de l'audio (via la balise éponyme HTML5) et des PDF.

### Avertissement ###
Ce script a été réalisé pour des besoins personnels avec la meilleure des volonté, mais de piètres compétences, de plus il en cours de dévelloppement, donc par conséquent il n'offre **aucune garantie**.

### Introduction ###
__PFDM__ ou partager une grande quantité de media, sans base de donnee, sans fioritures.
Les dits mediums, sont jetté en vrac dans un répertoire, mais leur nom de fichier doit respecter le format suivant:
* `YYYYMMDDNNNN-tag1-t_a_g_2-tag_3-tag_n.extention`

Avec:
* YYYY	: l`année sur 4 chiffres
* MM		: le mois sur 2 chiffres
* DD		: le jour sur 2 chiffres
* NNNN	: chiffres optionnels, pouvant être du genre heure, minutes, secondes, incrément, etc. ne serviront pour l'ordre dans l'arborescence, ou la différentiation
* tag1	: un premier tag, les underscores sont les seuls caractères minuscumle non-alphanumérique accéptés
* t_a_g_2: un deuxième tag
* tag_3	: un troisième tag
* tag_n	: un ènième tag, a priori, seul la raison de l'utilisateur et les capacité de PHP limite le nombre de tag exploitable


### Installation ###
Copiez l'ensemble des fichiers et répertoires à la racine de votre serveur web.
Adaptez la configuration locale dans le fichier `config.php`
Démerdez vous avec les droits d'écriture du répertoire de contenu et de vignettes.
Remplissez le répertoire de contenu avec ce qu'il faut.
Et hopla!

### Dépendances ###
* Les medium _image_ & _PDF_ nécessitent [PHP/imagick](http://fr.php.net/manual/fr/book.imagick.php) pour fabriquer les vignettes

### Source externe ###
* Les medium _image_ utilisent [LightZAP](https://github.com/dragonzap/LightZAP) par __Szalai Mihaly__ aka [Dragonzap](https://github.com/dragonzap) (inclu) pour un affichage à la mode.

### Licence ###
__PFDM__ est publié sous licence [GNU-GPLv3](http://www.gnu.org/licenses/gpl.html)

### TODO ###
Y'en a trop pour faire une liste ici, voir dans les commentaire du fichier `index.php`

### BUGS ###
* si majuscule dans un nom de fichier
* si on ajoute a l'URL un tags (par ex. MIME type 'application'), on peu acceder a un fichier qui ne respecte pas le pattern
* et sans doutes pleins d'autres....

# Merci pour votre intérêt #