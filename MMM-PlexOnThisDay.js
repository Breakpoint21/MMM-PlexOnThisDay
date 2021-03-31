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
		showImageInfo: false,
		// the sizing of the background image
		// cover: Resize the background image to cover the entire container, even if it has to stretch the image or cut a little bit off one of the edges
		// contain: Resize the background image to make sure the image is fully visible
		backgroundSize: 'cover', // cover or contain
		// if backgroundSize contain, determine where to zoom the picture. Towards top, center or bottom
		backgroundPosition: 'center', // Most useful options: "top" or "center" or "bottom"
		height: "300px",
		width: "300px",
		// location of the info div
		imageInfoLocation: 'bottomRight', // Other possibilities are: bottomLeft, topLeft, topRight
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		if (this.config.plex.hostname.length == 0) {
			this.errorMessage = "MMM-PlexSlideshow: Missing required parameter.";
		  } else {
			// create an empty image list
			this.images = [];
			// set beginning image index to 0, as it will auto increment on start
			this.imageIndex = 0;
			this.sendLoadImagesNotification();
		  }
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
		if (this.imageIndex >= this.images.length) {
			return null;
		}
		let image = this.images[this.imageIndex];

		return image.year ? `Heute vor {image.year}` : "Bilder";
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
		
		if (this.config.showImageInfo) {
			this.imageInfoDiv = this.createImageInfoDiv(wrapper);
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

	createImageInfoDiv: function (wrapper) {
		const div = document.createElement('div');
		div.className = 'info ' + this.config.imageInfoLocation;
		wrapper.appendChild(div);
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

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-PlexOnThisDay-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "PLEX_ON_THIS_DAY_LOADED_IMAGES") {
			// set dataNotification
			this.images = payload.images;
			console.log("Images received");
			console.log(this.images);
			this.resume();
		}
	},

	updateImage: function () {
		console.log("update image: " + this.imageIndex);
		console.log("update image: " + this.images.length);
		if (this.imageIndex >= this.images.length) {
			this.imageIndex = 0;
			this.updateImageList();
			  return;
		}

		let image = this.images[this.imageIndex];
		this.imageIndex += 1;

		const i = new Image();
		i.onload = () => {
console.log("image on load");

			// check if there are more than 2 elements and remove the first one
			if (this.imagesDiv.childNodes.length > 1) {
				this.imagesDiv.removeChild(this.imagesDiv.childNodes[0]);
			}
			if (this.imagesDiv.childNodes.length > 0) {
				this.imagesDiv.childNodes[0].style.opacity = '0';
			}

			const transitionDiv = document.createElement('div');
      		transitionDiv.className = 'transition';

			const imageDiv = this.createDiv();
			imageDiv.style.backgroundImage = `url("${i.src}")`;
			imageDiv.style.backgroundSize = "contain";
			  
			if (!this.browserSupportsExifOrientationNatively) {
				imageDiv.style.transform = this.getImageTransformCss(i.orientation);
			}

			transitionDiv.appendChild(imageDiv);
			this.imagesDiv.appendChild(transitionDiv);

			this.updateDom(this);
		};
		i.orientation = image.orientation;
		i.year = image.year;
		i.src = encodeURI(image.url);
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

	suspend: function () {
		if (this.timer) {
		  clearInterval(this.timer);
		  this.timer = null;
		}
	  },

	resume: function () {
		this.suspend(); // clears timer
		var self = this;
	
		this.timer = setInterval(function () {
		  // console.info('MMM-BackgroundSlideshow updating from resume');
		  self.updateImage();
		}, self.config.slideshowSpeed);
	  },
});
