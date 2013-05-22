/* LightZAP v2.53a
by Szalai Mihaly - http://dragonzap.szunyi.com
original by Lokesh Dhakar (lightbox) - http://lokeshdhakar.com

For more information, visit:
http://dragonzap.szunyi.com/index.php?e=page&al=lightzap&l=en

Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
- free for use in both personal and commercial projects
- attribution requires leaving author name, author link, and the license info intact

Thanks
- Scott Upton(uptonic.com), Peter-Paul Koch(quirksmode.com), and Thomas Fuchs(mir.aculo.us) for ideas, libs, and snippets.
- Artemy Tregubenko (arty.name) for cleanup and help in updating to latest proto-aculous in v2.05.
- Szalai Mihaly (dragonzap.szunyi.com), automatic image resize for screen, fullscreen viewer,  print button, download button, like button and new design.*/
(function () {
	var $ = jQuery,	album = [], currentImageIndex = 0, LightZAPOptions, lz;
	var $lightzap, $container, $image, $lbContainer, imgNotFound;	
	var windowWidth, windowHeight, originalWidth, originalHeight, isfull = false, marginWidth = -1, marginHeight = -1;
	var pfx = ["webkit", "moz", "ms", "o", ""];
	LightZAPOptions = (function () {
		function LightZAPOptions() {
			// Settings
			this.resizeDuration = 700;
			this.fadeDuration = 900;
			this.imagetext = ""; //"Image "
			this.oftext = " / "; //" of "
			this.bytext = "by";
			this.notfoundtext = "Image not found";
			// Optional
			this.print = false;
			this.download = false;
			this.like = true;
		}
		return LightZAPOptions;
	})();
	var LightZAP = (function () {
		function LightZAP(options) {
			lz = this;
			lz.options = options;

			//Set links
			_ref = $("a");
			for (i = 0; i < _ref.length; i++) {
				a = $(_ref[i]);
				if (typeof a.attr("data-lightzap") !== "undefined") {
					a.on("click", function (e) {
						lz.Start($(e.currentTarget));
						return false;
					});
				}
			}

			//Build lightzap
			$("<div/>", {"id": "lightzap"}).append (
				$("<div/>", {"class": "lz-container"}).append(
					$("<div/>", {"class": "lz-loader"}),
					$("<img/>", {"class": "lz-image"}),
					$("<div/>", {"class": "lz-nav"}).append(
						$("<a/>", {"class": "lz-prev"}),
						$("<a/>", {"class": "lz-next"})
					),
					$("<div/>", {"class": "lz-buttonContainer" }).append(
						$("<div/>", {"class": "lz-more lz-button" }),
						$("<div/>", {"class": "lz-close lz-button" })
					),
					$("<div/>", {"class": "lz-labelContainer" }).append(
						$("<div/>", {"class": "lz-float lz-caption"}),
						$("<div/>", {"class": "lz-float lz-desc"}),
						$("<div/>", {"class": "lz-float lz-resolution"}),
						$("<div/>", {"class": "lz-float lz-number"}),
						$("<a/>", {"class": "lz-float lz-by", "target": "_blank"})
					)
				)
			).appendTo($("body"));

			//Set varibles
			$lightzap = $("#lightzap").hide(); //and hide
			$image = $lightzap.find(".lz-image");
			$container = $lightzap.find(".lz-container");
			$lbContainer = $lightzap.find(".lz-labelContainer");

			//FullScreen
			var pfx0 = ["IsFullScreen", "FullScreen"];
			var pfx1 = ["CancelFullScreen", "RequestFullScreen"];
			var p = 0, k, m, t = "undefined";
			while (p < pfx.length && !document[m]) {
				k = 0;
				while (k < pfx0.length) {
					m = pfx0[k];
					if (pfx[p] == "") {
						m = m.substr(0, 1).toLowerCase() + m.substr(1);
						pfx1[0] = pfx1[0].substr(0, 1).toLowerCase() + pfx1[0].substr(1);
						pfx1[1] = pfx1[1].substr(0, 1).toLowerCase() + pfx1[1].substr(1);
					}
					m = pfx[p] + m;
					t = typeof document[m];
					if (t != "undefined") {
						pfx = [pfx[p] + pfx1[0], pfx[p] + pfx1[1], m];
						p = 2;
						break;
					}
					k++;
				}
				p++;
			}

			//Buttons
			$("<div/>", {"class": "lz-button lz-print"
			}).insertBefore(".lz-close").on("click", lz.Print);
			$("<div/>", {"class": "lz-button lz-download","target": "_blank"
			}).insertBefore(".lz-close").on("click", lz.Download);
			$("<div/>", {"class": "lz-like lz-button"
			}).insertBefore(".lz-close").on("click", lz.Like);
			if (p != 3) pfx = false;
			else {
				$("<div/>", {"class": "lz-fullScreen lz-button"}).insertBefore(".lz-close").on("click", function () {
					if (isfull)
						document[pfx[0]]();
					else
						document.getElementById("lightzap")[pfx[1]]();
				});
			}

			//Events
			$lightzap.find(".lz-close").on("click", lz.End);
			$lightzap.find(".lz-desc").hide();
			$lightzap.find(".lz-more").on("click", function (e) {
				if ($lbContainer.find(".lz-desc").css("display") == "none")
					$lbContainer.find(".lz-desc").show();
				else
					$lbContainer.find(".lz-desc").hide();
			});
			$lightzap.on("click", function (e) {
				if ($(e.target).attr("id") === "lightzap") lz.End();
			});
			$lightzap.find(".lz-prev").on("click", function (e) {
				lz.ChangeImage(lz.currentImageIndex + 1);
			});
			$lightzap.find(".lz-next").on("click", function (e) {
				lz.ChangeImage(lz.currentImageIndex - 1);
			});
		};
		LightZAP.prototype.Start = function ($link) {
			//Show overlay
			$("select, object, embed").css("visibility", "hidden");
			lz.SizeOverlay();
			$lightzap.fadeIn(lz.options.fadeDuration);
			window.onresize = lz.SizeOverlay;

			//Get original margin
			if (marginWidth == -1) {
				imgNotFound = $image.css("background-image").replace("url(", "").replace(")", "").replace('"', '').replace('"', '');
				$image.css("background-image", "none");
				marginHeight = parseInt($container.css("margin-top")) + parseInt($container.css("margin-bottom")) + parseInt($container.css("padding-top")) + parseInt($container.css("padding-bottom")) + parseInt($container.css("border-top-width")) + parseInt($container.css("border-bottom-width"));
				marginWidth = parseInt($container.css("margin-left")) + parseInt($container.css("margin-right")) + parseInt($container.css("padding-left")) + parseInt($container.css("padding-right"))+ parseInt($container.css("border-left-width")) + parseInt($container.css("border-right-width"));
				$container.css("margin", "0 auto");
			}

			//Create album
			album = [];
			var imageNumber = 0;
			if ($link.attr("data-lightzap") == "")
				lz.ReadAlbum($link);
			else
			{
				var a, _ref = $($link.prop("tagName") + "[data-lightzap='" + $link.attr("data-lightzap") + "']"), _href = $link.href, i = _ref.length, j = 0;
				while (i--)
				{
					a = $(_ref[i]);
					lz.ReadAlbum(a);
					if (a.attr("href") == $link.attr("href")) imageNumber = j;
					j++;
				}
			}
			lz.ChangeImage(imageNumber);
			return false;
		};
		LightZAP.prototype.ReadAlbum = function ($link) {
			var download = false, like = false, print = false, options = $link.attr("data-options");
			if (typeof options != "undefined") {
				download = options.indexOf("download") != -1;
				like = options.indexOf("like") != -1;
				print = options.indexOf("print") != -1;
			}

			album.push({
				link: $link.attr("href"),
				title: $link.attr("title"),
				desc: $link.attr("data-desc"),
				by: $link.attr("data-by"),
				by_link: $link.attr("data-link"),
				download: download,
				print: print,
				like: like
			});
		};
		LightZAP.prototype.ChangeImage = function (imageNumber) {
			//Hide other
			document.onkeypress = null;
			$lightzap.find(".lz-image, .lz-nav, .lz-buttonContainer, .lz-labelContainer").hide();
			$lightzap.find(".lz-loader").show();

			//New image
			$container.addClass("animating");
			var preloader = new Image;
			preloader.onload = function () {
				$image.attr("src", album[imageNumber].link);
				originalWidth = preloader.width;
				originalHeight = preloader.height;
				lz.currentImageIndex = imageNumber;
				return lz.GetImageSize();
			};
			preloader.onerror = function () {
				album[imageNumber].title = lz.options.notfoundtext;
				album[imageNumber].link = imgNotFound;
				$image.attr("src", album[imageNumber].link);
				originalWidth = 256;
				originalHeight = 256;
				lz.currentImageIndex = imageNumber;
				return lz.GetImageSize();
			};
			preloader.src = album[imageNumber].link;
		};
		LightZAP.prototype.SizeOverlay = function () {
			//If chanced size
			if (windowWidth != $(window).width() || windowHeight != $(window).height()) {
				//Set size
				windowWidth = ($(window).width() <= screen.width) ? $(window).width() : screen.width * 0.8;
				windowHeight = ($(window).height() <= screen.height) ? $(window).height() : screen.height * 0.8;
				$lightzap.width($(window).width()).height($(window).height());

				//Is fullscreen?
				isfull = false;
				if (pfx != false) isfull = (typeof document[pfx[2]] == "function" ? document[pfx[2]]() : document[pfx[2]]);

				if (!isfull) isfull = (windowWidth >= screen.width * 0.99 && windowHeight >= screen.height * 0.99);

				//Set style
				if (isfull) {
					$lightzap.attr("class", "full-screen");
					$lightzap.attr("style", "");
					$container.attr("style", "height: 100%;");
				} else {
					$lightzap.attr("class", "");
					$container.attr("style", "");
				}

				//Update image size
				if (album.length > 0) lz.GetImageSize();
			}
		};
		LightZAP.prototype.GetImageSize = function () {
			//Sizes
			$image.css("height", "auto");
			var placeWidth = windowWidth, placeHeight = windowHeight, imageWidth = originalWidth, imageHeight = originalHeight;
			if (!isfull) {
				placeWidth -= marginWidth;
				placeHeight -= marginHeight;
			} else if (pfx) {
				placeWidth = screen.width;
				placeHeight = screen.height;
			}

			//Calculate optional size
			if (imageWidth > placeWidth) {
				imageHeight = (placeWidth * imageHeight) / imageWidth;
				imageWidth = placeWidth;
			}
			if (imageHeight > placeHeight) {
				imageWidth = (placeHeight * imageWidth) / imageHeight;
				imageHeight = placeHeight;
			}

			//Set fullscreen style
			if (isfull) {
				$image.css("height", imageHeight);
				$image.css("margin", Math.max((placeHeight - imageHeight) / 2, 0) + "px " + Math.max((placeWidth - imageWidth) / 2, 0) + "px");
				$container.css("margin", "0");
				return lz.ShowImage();
			}

			//Set box style
			var oldWidth = $container.outerWidth(),	oldHeight = $container.outerHeight();
			$image.css("margin", "0");
			$container.css("margin", "0 auto");
			var _marginTop = (windowHeight - imageHeight) / 2; //Thanks antix
			if ($container.attr("class") === "lz-container animating") {
				if (oldHeight === 0 || (imageWidth !== oldWidth && imageHeight !== oldHeight)) {
					$container.animate({
						width: imageWidth,
						height: imageHeight,
						marginTop: _marginTop
					}, lz.options.resizeDuration, "swing");
				} else if (imageWidth !== oldWidth) {
					$container.animate({
						width: imageWidth
					}, lz.options.resizeDuration, "swing");
				} else if (imageHeight !== oldHeight) {
					$container.animate({
						height: imageHeight,
						marginTop: _marginTop
					}, lz.options.resizeDuration, "swing");
				}
				else
					$container.css("margin-top", _marginTop + "px");
			}
			else
				$container.width(imageWidth).height(imageHeight).css("margin-top", _marginTop + "px");

			setTimeout(function () {
				$lightzap.find(".lz-prevLink").height(imageHeight);
				$lightzap.find(".lz-nextLink").height(imageHeight);
				lz.ShowImage();
			}, lz.options.resizeDuration);
		};
		LightZAP.prototype.ShowImage = function () {
			$image.fadeIn(lz.options.fadeDuration * 0.75);
			lz.UpdateNav();
			lz.UpdateDetails();
			$lbContainer.fadeIn(lz.options.fadeDuration * 0.5);
			$lightzap.find(".lz-buttonContainer").fadeIn(lz.options.fadeDuration * 0.5);
			$lightzap.find(".lz-loader").hide();

			//Preload
			var preloadNext, preloadPrev;
			if (album.length > lz.currentImageIndex + 1) {
				preloadNext = new Image;
				preloadNext.src = album[lz.currentImageIndex + 1].link;
			}
			if (lz.currentImageIndex > 0) {
				preloadPrev = new Image;
				preloadPrev.src = album[lz.currentImageIndex - 1].link;
			}
		};
		LightZAP.prototype.UpdateDetails = function () {
			//Counter
			var element = $lbContainer.find(".lz-number");
			if (album.length > 1)
				element.html(lz.options.imagetext + (album.length - lz.currentImageIndex + 1) + lz.options.oftext + album.length).fadeIn(lz.options.fadeDuration * 0.5);
			else
				element.hide();

			//Caption
			element = $lbContainer.find(".lz-caption");
			if (typeof album[lz.currentImageIndex].title !== "undefined" && album[lz.currentImageIndex].title !== "") {
				element.html(album[lz.currentImageIndex].title).fadeIn(lz.options.fadeDuration * 0.5);
				if (album[lz.currentImageIndex].title == lz.options.notfoundtext) return false;
			}
			else
				element.html("");

			//Caption
			element = $lbContainer.find(".lz-more");
			if (typeof album[lz.currentImageIndex].desc !== "undefined" && album[lz.currentImageIndex].desc !== "") {
				element.show();
				$lbContainer.find(".lz-desc").html(album[lz.currentImageIndex].desc).hide();
			}
			else
				element.hide();

			//Author
			element = $lbContainer.find(".lz-more");
			if (typeof album[lz.currentImageIndex].by != "undefined" && album[lz.currentImageIndex].by != "") {
				element.html(lz.options.bytext + " <span>" + album[lz.currentImageIndex].by + "</span>").fadeIn(lz.options.fadeDuration * 0.5);
				if (typeof album[lz.currentImageIndex].by_link !== "undefined" && album[lz.currentImageIndex].by_link !== "") element.prop("href", album[lz.currentImageIndex].by_link);
			} else {
				element.html("");
				if (typeof album[lz.currentImageIndex].by_link !== "undefined" && album[lz.currentImageIndex].by_link !== "") $lbContainer.find(".lz-caption").html('<a target="_blank" href="' + album[lz.currentImageIndex].by_link + '">' + $lbContainer.find(".lz-caption").html() + '</a>');
			}

			//Others
			if (album[lz.currentImageIndex].like != lz.options.like) $lightzap.find(".lz-like").show();
			if (album[lz.currentImageIndex].download != lz.options.download) $lightzap.find(".lz-download").show();
			if (album[lz.currentImageIndex].print != lz.options.print) $lightzap.find(".lz-print").show();

			$lbContainer.find(".lz-resolution").html(originalWidth + " x " + originalHeight).fadeIn(lz.options.fadeDuration * 0.5);
			$container.removeClass("animating");
		};
		LightZAP.prototype.UpdateNav = function () {
			$lightzap.find(".lz-nav").fadeIn(lz.options.fadeDuration * 0.5);
			if (lz.currentImageIndex > 0) $lightzap.find(".lz-next").show();
			else $lightzap.find(".lz-next").hide();
			if (lz.currentImageIndex < album.length - 1) $lightzap.find(".lz-prev").show();
			else $lightzap.find(".lz-prev").hide();
			document.onkeypress = lz.KeyboardAction;
		};
		LightZAP.prototype.KeyboardAction = function (event) {
			var keycode = event.keyCode, key = String.fromCharCode(event.keyCode).toLowerCase(),
				KEYCODE_ESC = 27,
				KEYCODE_LEFTARROW = 37,
				KEYCODE_RIGHTARROW = 39,
				KEYCODE_F11 = 122;
			if (keycode == KEYCODE_ESC || key.match(/x|o|c/)) lz.End();
			else if (key == "p" || keycode == KEYCODE_LEFTARROW)
			{
				if (lz.currentImageIndex != 0) lz.ChangeImage(lz.currentImageIndex - 1);
			}
			else if((key == "n" || keycode == KEYCODE_RIGHTARROW) && lz.currentImageIndex != album.length - 1) lz.ChangeImage(lz.currentImageIndex + 1);
		};
		LightZAP.prototype.Print = function () {
			win = window.open();
			self.focus();
			win.document.open();
			win.document.write("<html><body stlye='margin:0 auto;padding:0;'><h1 style='margin:0 0 0.48em;'>" + $lightzap.find(".lz-caption").html() + "</h1><div style='text-align:center;'><img src='" + album[lz.currentImageIndex].link + "' style='max-width:100%;max-height:100%;'/></div><div style='text-align:right;'><i>" + $lightzap.find(".lz-by").html() + "</i></div></body></html>");
			win.document.close();
			win.print();
			win.close();
		};
		LightZAP.prototype.Like = function () {
			if (!window.focus) return true;
			window.open("http://www.facebook.com/sharer/sharer.php?u=" + $image.attr("src"), "", 'width=400,height=200,scrollbars=yes');
		};
		LightZAP.prototype.Download = function () { //Beta version
			if (window.webkitURL) { //Webkit
				var xhr = new XMLHttpRequest();
				xhr.open("GET", album[lz.currentImageIndex].link);
				xhr.responseType = "blob";
				xhr.onreadystatechange = function () {
					var a = document.createElement("a");
					a.href = (window.URL) ? window.URL.createObjectURL(xhr.response) : window.webkitURL.createObjectURL(xhr.response);
					a.download = album[lz.currentImageIndex].link.substring(album[lz.currentImageIndex].link.lastIndexOf("/") + 1);
					var e = document.createEvent("MouseEvents");
					e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					a.dispatchEvent(e);
				};
				xhr.send();
				return true;
			}
			else if (navigator.appName == 'Microsoft Internet Explorer') { //IE
				win = window.open(album[lz.currentImageIndex].link);
				self.focus();
				win.document.execCommand("SaveAs");
				win.close();
				return true;
			}
			else { //Opera & Firefox (CANVAS)
				var canvas = document.createElement("canvas");
				document.body.appendChild(canvas);
				if (typeof canvas.getContext != "undefined") {
					try {
						var context = canvas.getContext("2d");
						canvas.width = Math.min(originalWidth, 1024);
						canvas.height = Math.min(originalHeight, originalHeight / originalWidth * 1024);
						canvas.style.width = canvas.width + "px";
						canvas.style.height = canvas.height + "px";
						context.drawImage(document.getElementsByClassName("lz-image")[0], 0, 0, canvas.width, canvas.height);
						document.location.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
						document.body.removeChild(canvas);
						return true;
					} catch (err) {
						document.body.removeChild(canvas);
					}
				}
			}
			alert("Sorry, can't download");
		};
		LightZAP.prototype.End = function () {
			if (isfull && pfx != false) document[pfx[0]]();
			album = [];
			document.onkeypress = null;
			window.onresize = null;
			$lightzap.fadeOut(lz.options.fadeDuration);
			$("select, object, embed").css("visibility", "visible");
		};
		return LightZAP;
	})();
	$(function () {
		var lightzap, options;
		options = new LightZAPOptions;
		return lightzap = new LightZAP(options);
	});
}).call(this);
