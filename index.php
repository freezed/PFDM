<?php
$debutScript	= microtime(TRUE);
/*
 * index.php
 *
 * PFDM - Publication Facile De Medium
 *
 * auteur:	Freezed <freezed at zind dot fr>
 * version:	0.1
 * MaJ:		22.05.2013
 *
 * [TODO] voir dans le script, y'en a plein :)
 * [TODO] regler le probleme de droits d'ecriture dans l'arborescence
 * [BUG] si majuscule dans nom de fichier
 * [BUG] On peu acceder a un fichier qui n'est pas pris en compte
 *			par parseContent() si on ajoute a l'URL un de ces tags
 *			(par ex. MIME type 'application')
 *
 * Licence GNU GPL v3 [http://www.gnu.org/licenses/gpl.html]
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 */


/******************************************************************************
 *																				*
 * 										CONFIG DU SCRIPT						*
 *																				*
 *****************************************************************************/

// inclure la config locale
include('./config.php');

define('SCRIPT_NAME',		'PFDM');
define('SCRIPT_URL',			'https://github.com/freezed/PFDM');
define('SCRIPT_VERSION',	'0.1');
define('RELEASE_DATE',		'21.05.2013');

// Tableau de traduction
$translateArray	=	array(
	'01'		=> 'janvier',
	'02'		=> 'f&eacute;vier',
	'03'		=> 'mars',
	'04'		=> 'avril',
	'05'		=> 'mai',
	'06'		=> 'juin',
	'07'		=> 'juillet',
	'08'		=> 'ao&ucirc;t',
	'09'		=> 'septembre',
	'10'		=> 'octobre',
	'11'		=> 'novembre',
	'12'		=> 'd&eacute;cembre',
	// Type de tag
	'year'	=> 'ann&eacute;e',
	'month'	=> 'mois',
	'tag'		=> 'mot cl&eacute;',
	'mime'	=> 'type'
);

$alertHtml 		=	'';
$menuHtml 		=	'';
$previewHtml 	=	'';
$debugHtml 		=	'';
$corpsHtml		=	'<section>'.PHP_EOL;

//TODO: create DIR if not exist
$content			=	scandir(CONTENT_DIR);

/******************************************************************************
 *																				*
 * 											FONCTIONS							*
 *																				*
 *****************************************************************************/

/*
 *		Traduction pour la page HTML
 */
function translate($word, $context = NULL)
{
	global $translateArray;

	if(
		($context == 'month'		AND array_key_exists($word, $translateArray))
			OR
		($context == 'tag'		AND array_key_exists($word, $translateArray))
			OR
		($context == 'year'		AND $word == 'year')
			OR
		($context == 'tag'		AND $word == 'tag')
			OR
		($context == 'mime'		AND $word == 'mime')
	) {
		return ucfirst($translateArray[$word]);

	} elseif(
	(ctype_digit($word))
		OR
	($context == 'tag')
		OR
	($context == 'mime')){
		return $word;

	} else {
		return ucfirst($word);
	}
}


/*
 *		Controle et affectation des variables GET
 */
//	[TODO]	[BUG] on peu acceder a un fichier qui n'est pas pris en compte
//	[TODO]	[BUG] par parseContent() si on ajoute a l'URL un de ces tags
//	[TODO]	[BUG] (par ex. MIME type 'application')

function ctrlGET($GET)
{
//	[TODO]	utiliser une regex pour autoriser underscore dans une chaine alphaNum?
	if(isset($GET['tag']) AND !ctype_digit($GET['tag'])){
		$checkGET = explode('_', $GET['tag']);

		foreach($checkGET as $text) {
			if(!ctype_alnum($text)) {
				return FALSE;
				break;
			}
		}
//	[TODO]	permettre la selection de plusieurs tag
		$navig['ctrlGET']['tag'] = $GET['tag'];
	}

	if(isset($GET['year'])
	AND ctype_digit($GET['year'])
	AND strlen($GET['year']) == 4) {
		$navig['ctrlGET']['year'] = $GET['year'];
	}

	if(isset($GET['month'])
	AND ctype_digit($GET['month'])
	AND strlen($GET['month']) == 2) {
		$navig['ctrlGET']['month'] = $GET['month'];
	}

	if(isset($GET['mime'])
	AND ctype_alpha($GET['mime'])) {
		$navig['ctrlGET']['mime'] = $GET['mime'];
	}

	if(isset($navig['ctrlGET'])) {
		return $navig['ctrlGET'];
	} else {
		return FALSE;
	}
}


/*
 * Deduit le type MIME de l'extention en attendant de regler le probleme des
 * fichiers OGG qui rendent un type MIME "application/ogg" avec finfo_file()
 * Permet de forcer le type text/pdf pour les fichiers PDF
 * source: http://php.net/manual/fr/function.mime-content-type.php#87856
 * Doc. MIME Apache: http://httpd.apache.org/docs/2.2/mod/mod_mime.html
 */
function getMimeType($filename, $part=NULL)
{
	$mime_types = array(
		'pdf' => 'text/pdf',
		'ogg' => 'audio/ogg',
		'oga' => 'audio/ogg',
		'ogv' => 'video/ogg',
		'ogm' => 'video/ogg'
	);

	$explodedFilename = explode('.',$filename);
	$ext = strtolower(array_pop($explodedFilename));
	if(array_key_exists($ext, $mime_types)) {
		$retour = $mime_types[$ext];

	} elseif (function_exists('finfo_open')) {
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		$mimetype = finfo_file($finfo, dirname(__FILE__).'/'.CONTENT_DIR.$filename);
		finfo_close($finfo);
		$retour = $mimetype;

	} else {
		$retour = 'application/octet-stream';
	}

	if($part == 'MINOR') {
		 $retour = explode('/', $retour);
		 return $retour[0];

	} elseif ($part == 'MAJOR') {
		 $retour = explode('/', $retour);
		 return $retour[1];

	} else {
		return $retour;
	}
}

/*
 *		Parsage des noms de fichier pour la generations des info
 */
function parseContent($content)
{
	$navig['contentArray'] = FALSE;
	foreach($content as $file) {

		if(!is_dir(CONTENT_DIR.$file)) {
			$filePart = array_reverse(explode('.', $file));
			$fileTag = explode('-', strtolower($filePart[1]));		// nom du fichier sans ext

			// element date, sur 8 chiffres mini
			if(
				strlen($fileTag[0]) >= 8
				AND ctype_digit($fileTag[0])
			) {
				$dateFile = str_split($fileTag[0], 4);
				$monthFile = str_split($dateFile[1], 2);

				// Annee
				if($dateFile[0] > YEAR_MIN) {
					$navig['contentArray']['year'][] = $dateFile[0];
				}

				// Mois
				if($monthFile[0] <> 0
				AND $monthFile[0] < 13) {
					$navig['contentArray']['month'][] = $monthFile[0];
				}

				// MIME type
				$navig['contentArray']['mime'][] = getMimeType($file, 'MINOR');

				// Tags suivants : tags
				for($i=1; isset($fileTag[$i]); $i++) {
					if(!ctype_digit($fileTag[$i])) {
						$navig['contentArray']['tag'][] = $fileTag[$i];
					}
				}
			}
		}
	}
	return $navig['contentArray'];
}


/*
 * 	Fabrication de vignettes avec php5-imagick
 */
function makeThumb($file, $isPDF=NULL)
{
	if(extension_loaded('imagick')){
		if($isPDF==NULL){
			$thumb = new Imagick(CONTENT_DIR.$file);
			$thumb->scaleImage(100,0);
			$d = $thumb->getImageGeometry();
			$h = $d['height'];
			if($h > 70) {
				$thumb->scaleImage(0,70);
			}
			$thumb->setImageCompression(Imagick::COMPRESSION_JPEG);
			$thumb->setImageCompressionQuality(50);
			$thumb->stripImage();
			$thumb->writeImage(CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$file);
			$thumb->clear();
			$thumb->destroy();
			return TRUE;

		} elseif($isPDF==TRUE)  {
			$thumb = new imagick(CONTENT_DIR.$file.'[0]');
			//$thumb->setImageColorspace(255); (genere des image verte sur autre config)
			$thumb = $thumb->flattenImages();
			$thumb->setCompression(Imagick::COMPRESSION_JPEG);
			$thumb->setCompressionQuality(50);
			$thumb->setImageFormat('jpeg');
			$thumb->scaleImage(250,0);
			$d = $thumb->getImageGeometry();
			$h = $d['height'];

			if($h > 250) {
				$thumb->scaleImage(0,250);
			}
			$thumb->writeImage(CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$file.'.jpg');
			$thumb->clear();
			$thumb->destroy();
			return TRUE;
		}

	} else {
		return '<pre class="error">Le script a besoin de la librairie Imagick</pre>';
	}
}


/******************************************************************************
 *																				*
 * 											SCRIPT								*
 *																				*
 *****************************************************************************/

/*
 *		Traitement de(s) variable(s) GET, identification de(s) fichier(s)
 */
 if(ctrlGET($_GET)) {
	$navig['ctrlGET'] = ctrlGET($_GET);

	foreach($content as $position => $fileName) {
//	[TODO]	si plusieurs tag: le dernier ecrase les precedents
		if(isset($navig['ctrlGET']['tag'])) {
			if(strpos($fileName, $navig['ctrlGET']['tag']) !== FALSE) {
				$someMatchingFiles['tag'][] = $fileName;
			}
		}

		if(isset($navig['ctrlGET']['year'])) {
			$pos = strpos($fileName, $navig['ctrlGET']['year']);

			if($pos < 4 AND $pos !== FALSE) {
				$someMatchingFiles['year'][] = $fileName;
			}
		}

		if(isset($navig['ctrlGET']['month'])) {
			$pos = strpos($fileName, $navig['ctrlGET']['month']);

			if($pos < 6 AND $pos > 3 AND $pos !== FALSE) {
				$someMatchingFiles['month'][] = $fileName;
			}
		}

		if(isset($navig['ctrlGET']['mime'])) {
			if($navig['ctrlGET']['mime'] == getMimeType($fileName, 'MINOR')) {
				$someMatchingFiles['mime'][] = $fileName;
			}
		}
	}

	// Tag ne donnant pas de fichiers
	if(!isset($someMatchingFiles)) {
		$navig['contentArray'] = parseContent($content);
		unset($navig['ctrlGET']);
	}

	// Support d'un ou plusieurs type de valeur $_GET pour affiner la recherche
	elseif(isset($someMatchingFiles)
	AND count($someMatchingFiles) > 1) {
		$navig['matchingFiles'] = call_user_func_array('array_intersect', $someMatchingFiles);
		$navig['contentArray'] = parseContent($navig['matchingFiles']);

	} elseif(isset($someMatchingFiles)) {
		$result = array_values($someMatchingFiles);
		$navig['matchingFiles'] = $result[0];
		$navig['contentArray'] = parseContent($navig['matchingFiles']);
	}

/*
 *		Page d'acceuil, sans parametre $_GET'
 */
} else {
	$navig['contentArray'] = parseContent($content);
}


/*
 *		Fabrication du menu HTML
 */
if(isset($navig['contentArray'])) {

// TODO: faire un message si pas de fichiers dispo
	foreach($navig['contentArray'] as $tagType => $tags) {
			$menuHtml .= '	<p><b>'. translate($tagType, $tagType) .': </b>';
			sort($tags);
			$tagList = array_count_values($tags);

			foreach($tagList as $tag => $quantite) {
//	[TODO]	en attendant de pouvoir utiliser http_build_url() fourni par PECL_http
//	[TODO]	on rajoute les tags selement si il ne sont pas deja dans l'URL

				// requete presente dans l'URL
				if(isset($navig['ctrlGET'])
				AND !array_search($tag, $navig['ctrlGET'])) {
					$request = '?';

					foreach($navig['ctrlGET'] as $requestTagType => $requestTag) {
						$request .= $requestTagType.'='.$requestTag.'&';
					}
					$targetURL = $_SERVER['PHP_SELF'].$request.$tagType.'='.$tag;
					$menuHtml .= ' <a href="'.$targetURL.'" title="'.$quantite.' dispo">'.translate($tag, $tagType).'</a>';

				// si il n'y a pas de requete dans l'URL
				} elseif (!isset($navig['ctrlGET'])){
					$targetURL = $_SERVER['PHP_SELF'].'?'.$tagType.'='.$tag;
					$menuHtml .= ' <a href="'.$targetURL.'" title="'.$quantite.' dispo">'.translate($tag, $tagType).'</a>';

				// si le tag est deja dans l'URL
//	[TODO]	ajouter un lien qui supprime le tag
				} else {
					$menuHtml .= ' <strong>['.translate($tag, $tagType).']</strong> ';
				}
			}

		$menuHtml .= '	</p>'.PHP_EOL;
	}
	$menuHtml = '<nav>'.PHP_EOL.$menuHtml.'</nav>'.PHP_EOL;
//	[TODO]	Liens vers les nouveaute, masquer si pas de news, afficher la quantite
//	[TODO]	$menuHtml .= '	<p><b><a href="'.$_SERVER['PHP_SELF'].'?fresh=1" title="Nouveaut&eacute;">Nouveaut&eacute;</a></b>'.PHP_EOL;
}

/*
 *  Affichage des preview de media
 */
//	[TODO]	Pour les grosses quantitee a afficher, envisager de paginer
//	[TODO]	pour alleger le chargement de la page
if(isset($navig['matchingFiles'])) {
$i=0;

	foreach($navig['matchingFiles'] as $id => $fileName) {
//	[TODO]	utiliser les idTag des fichiers pour completer l'affichage

		if(getMimeType($fileName, 'MINOR') == 'audio') {
			$previewHtml  =	'	<p>'.PHP_EOL;
			$previewHtml .=	'		<a href="'.CONTENT_DIR.$fileName.'" title="Telecharger le fichier">'.$fileName.'</a> : '.PHP_EOL;
			$previewHtml .=	'		<audio controls title="Ecouter \''.$fileName.'\'" src="'.CONTENT_DIR.$fileName.'">L\'affichage du lecteur n\'est pas pris en charge par votre navigateur</audio>'.PHP_EOL;
			$previewHtml .=	'	</p>'.PHP_EOL;
		}
		elseif(getMimeType($fileName, 'MINOR') == 'video') {
			$previewHtml  =	'	<p>'.PHP_EOL;
			$previewHtml .=	'		<a href="'.CONTENT_DIR.$fileName.'" title="Telecharger le fichier">'.$fileName.'</a> : '.PHP_EOL;
			$previewHtml .= 	'		<video controls title="Voir \''.$fileName.'\'" src="'.CONTENT_DIR.$fileName.'">L\'affichage du lecteur n\'est pas pris en charge par votre navigateur</video>'.PHP_EOL;
			$previewHtml .=	'	</p>'.PHP_EOL;
		}
		elseif(getMimeType($fileName, 'MINOR') == 'image') {

			if(
				!file_exists(CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$fileName)
				OR filemtime(CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$fileName) < filemtime(CONTENT_DIR.$fileName)
			) {
				if(makeThumb($fileName) !== TRUE) {
					$alertHtml = makeThumb($fileName);
				} else {
					$i++;
				}
			}
			$previewHtml =		'<a href="'.CONTENT_DIR.$fileName.'" data-lightzap="group" title="'.$fileName.'"><img src="'.CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$fileName.'"/></a>'.PHP_EOL;

		}
		elseif(getMimeType($fileName, 'MAJOR') == 'pdf') {

			if(
				!file_exists(CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$fileName.'.jpg')
				OR filemtime(CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$fileName.'.jpg') < filemtime(CONTENT_DIR.$fileName)
			) {
				if(makeThumb($fileName, TRUE) !== TRUE) {
					$alertHtml = makeThumb($fileName, TRUE);
				}
				else {
					$i++;
				}
			}
			$previewHtml =		'<a href="'.CONTENT_DIR.$fileName.'" title="'.$fileName.'"><img src="'.CONTENT_DIR.THUMB_DIR.THUMB_PREFIX.$fileName.'.jpg"/></a>'.PHP_EOL;

//	[TODO]	OpenDocument
		}
		else {
			$previewHtml =		'	<p><em>['.getMimeType($fileName, 'MINOR').'/'.getMimeType($fileName, 'MAJOR').']</em></p>'.PHP_EOL;
			$previewHtml .= 	'	<p>'.$fileName.': <b>Pas de preview</b><br/>'.PHP_EOL;
			$previewHtml .=	'	<a href="'.CONTENT_DIR.$fileName.'" title="Telecharger">lien</a></p>'.PHP_EOL;
		}
		$corpsHtml .= $previewHtml;
	}
	if($i == 1){
		$alertHtml .= '<section class="info">Une vignette &agrave; &eacute;t&eacute; g&eacute;n&eacute;r&eacute;e!' . '</section>'.PHP_EOL;
	} elseif($i>1){
		$alertHtml .= '<section class="info">' . $i . ' vignettes ont &eacute;t&eacute; g&eacute;n&eacute;r&eacute;e!' . '</section>'.PHP_EOL;
	}
}



///* DEBUG */ $debugHtml = '<pre><small>navig: '.print_r($navig, TRUE).'</small></pre>'.PHP_EOL;
/******************************************************************************
 *																				*
 * 										PAGE HTML								*
 *																				*
 *****************************************************************************/
include ('header.php');
echo $alertHtml . $menuHtml . $debugHtml . $corpsHtml;
include ('footer.php');
?>
