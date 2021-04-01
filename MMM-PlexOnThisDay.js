/* global Module */

/* Magic Mirror
 * Module: MMM-PlexOnThisDay
 *
 * By Pascal Schumann
 * MIT Licensed.
 */

Module.register("MMM-PlexOnThisDay", {
	defaults: {
		plex: {
			hostname: "localhost",
			port: 32400,
			apiToken: ""
		  },
		slideshowSpeed: 10 * 1000,
		years: 10,
		// the sizing of the background image
		// cover: Resize the background image to cover the entire container, even if it has to stretch the image or cut a little bit off one of the edges
		// contain: Resize the background image to make sure the image is fully visible
		backgroundSize: 'cover', // cover or contain
		// if backgroundSize contain, determine where to zoom the picture. Towards top, center or bottom
		backgroundPosition: 'center', // Most useful options: "top" or "center" or "bottom"
		height: "300px",
		width: "100%",
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		Log.info("Starting module: " + this.name);
		if (this.config.plex.hostname.length == 0) {
			this.errorMessage = "MMM-PlexSlideshow: Missing required parameter.";
		  } else {
			this.browserSupportsExifOrientationNatively = CSS.supports(
				'image-orientation: from-image'
			);
			this.images = [];
			this.imageIndex = 0;
			this.sendLoadImagesNotification();
			setInterval(function() {
				self.advanceCurrentImage();
				self.updateDom();
			}, this.config.slideshowSpeed);
		  }
	},

	advanceCurrentImage: function () {
		var self = this;
		if (self.images.length > 0) {
			self.imageIndex += 1;
			if(self.imageIndex >= self.images.length) {
				self.sendLoadImagesNotification();
			}
		}
	},

	hasCurrentImage: function () {
		if (this.images.length === 0 || this.imageIndex >= this.images.length) {
			return false;
		}
		return true;
	},

	sendLoadImagesNotification: function () {
		console.info("Getting Images");
		// ask helper function to get the image list
		this.sendSocketNotification(
		  "PLEX_ON_THIS_DAY_LOAD_IMAGES",
		  this.config
		);
	},

	getHeader: function () {
		if (!this.hasCurrentImage()) {
			return null;
		}
		let image = this.images[this.imageIndex];
		var currentYear = new Date().getFullYear();
		var yearsAgo = currentYear - image.year;

		if(yearsAgo === 1)
		{
			return this.translate("header_one_year");
		}
		return this.translate("header_serverl_years", {years: yearsAgo});
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");

		self.imagesDiv = document.createElement('div');
		self.imagesDiv.className = 'images';
		self.imagesDiv.style.width = self.config.width;
		self.imagesDiv.style.height = self.config.height;
    	wrapper.appendChild(self.imagesDiv);
		
		if (this.hasCurrentImage()) {
			let image = this.images[this.imageIndex];
			//this.imageIndex += 1;

			const i = new Image();
			i.onload = () => {
				const imageDiv = this.createDiv();
				imageDiv.style.backgroundImage = `url("${i.src}")`;
				imageDiv.style.backgroundSize = "contain";
				
				if (!this.browserSupportsExifOrientationNatively) {
					imageDiv.style.transform = this.getImageTransformCss(i.orientation);
					// when image will be rotated, then height and width need to be swapped
					if(i.orientation == 6 || i.orientation === 8) {
						self.imagesDiv.style.width = self.config.height;
						self.imagesDiv.style.height = self.config.width;
						self.imagesDiv.style.marginTop = "40px";
					}
				}

				this.imagesDiv.appendChild(imageDiv);
			};
			i.orientation = image.orientation;
			i.year = image.year;
			i.src = encodeURI(image.url);
		}
		return wrapper;
	},

	createDiv: function () {
		var div = document.createElement('div');
		div.style.backgroundSize = this.config.backgroundSize;
		div.style.backgroundPosition = this.config.backgroundPosition;
		div.className = 'image';
		return div;
	},

	getScripts: function() {
		return [];
	},

	getStyles: function () {
		return [
			"MMM-PlexOnThisDay.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "PLEX_ON_THIS_DAY_LOADED_IMAGES") {
			this.images = payload.images;
			this.imageIndex = 0;
			this.updateDom();
		}
	},

	getImageTransformCss: function (exifOrientation) {
		switch (exifOrientation) {
		  case 2:
			return 'scaleX(-1)';
		  case 3:
			return 'scaleX(-1) scaleY(-1)';
		  case 4:
			return 'scaleY(-1)';
		  case 5:
			return 'scaleX(-1) rotate(90deg)';
		  case 6:
			return 'rotate(90deg)';
		  case 7:
			return 'scaleX(-1) rotate(-90deg)';
		  case 8:
			return 'rotate(-90deg)';
		  case 1: // Falls through.
		  default:
			return 'rotate(0deg)';
		}
	  },
});
