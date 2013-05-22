</section>
<footer>
	<p><?php	echo 'Retour vers: <a href="'.HOME_URL.'" title="Acceuil">Acceuil</a> | <a href="#top" title="Haut de page">Haut de page'	;	?></a></p>
	<p>
		<small>
<?php
	echo '			[<a href="'.SCRIPT_URL.'" title="'.SCRIPT_NAME.' v.'.SCRIPT_VERSION.' ('.RELEASE_DATE.')">'.SCRIPT_NAME.'</a>]';
	$finScript	= microtime(TRUE);
	$duree = $finScript-$debutScript;
?> | [dur&eacute;e: <?php echo $duree;?>s]
		</small>
	</p>
</footer>
</body>
</html>