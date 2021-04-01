/* Magic Mirror
 * Node Helper: MMM-PlexOnThisDay
 *
 * By Pascal Schumann
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var PlexAPI = require("plex-api");
var moment = require("moment");
var api = null;
module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		if (notification === "PLEX_ON_THIS_DAY_LOAD_IMAGES") {
			// this to self
			var self = this;
			var config = payload;

			// get the image list
			var imageList = [];
			this.loadPlexImages(config).then((r) => {
			  imageList = r;
			  if (config.randomizeImageOrder) {
				imageList = this.shuffleArray(imageList);
			  }
	  
			  // build the return payload
			  var returnPayload = {
				identifier: config.identifier,
				images: imageList
			  };
			  // send the image list back
			  self.sendSocketNotification(
				"PLEX_ON_THIS_DAY_LOADED_IMAGES",
				returnPayload
			  );
			});
		}
	},

	// Example function send notification test
	sendNotificationTest: function(payload) {
		this.sendSocketNotification("MMM-PlexOnThisDay-NOTIFICATION_TEST", payload);
	},

	// this you can create extra routes for your module
	extraRoutes: function() {
		var self = this;
		this.expressApp.get("/MMM-PlexOnThisDay/extra_route", function(req, res) {
			// call another function
			values = self.anotherFunction();
			res.send(values);
		});
	},

	// Test another function
	anotherFunction: function() {
		return {date: new Date()};
	},

	getPhotoUrl: function (plexPhoto) {
		return `http://${api.hostname}:${api.port}${plexPhoto.Media[0].Part[0].key}?X-Plex-Token=${api.authToken}`;
	},

	loadPlexImages: function (config) {
		if (api === null) {
		  var options = {
			hostname:
			  config.plex.hostname !== null ? config.plex.hostname : "localhost",
			port: config.plex.port ? config.plex.port : 32400,
			token: config.plex.apiToken
		  };
		  
		  console.log("Create PLEX Client : ", options);
		  api = new PlexAPI(options);
		  console.log("PLEX Client created");
		}
	
		var self = this;
		var imageList = [];
		return new Promise((resolve, reject) => {
		  // Get list of playlists
		  api.query("/library/sections").then(function (sectionsResponse) {
			// Find playlist of photos which is Favorites
			var photoSections = sectionsResponse.MediaContainer.Directory.filter((directory) => 
				directory.type === "photo"
			);

			var years = config.years;
			var promises = photoSections.flatMap((section) => {
				return Array.from(Array(years), (v, i) => {
					return api.query(self.getRequestUrl(section.key, i + 1)).then(function (photosResponse) {
						if(photosResponse.MediaContainer.size)
						{
							photosResponse.MediaContainer.Metadata.forEach((photo) => {
								imageList.push({
									url: self.getPhotoUrl(photo),
									orientation: photo.Media[0].Part[0].orientation,
									year: photo.year
								});
							});
						}
						
					});
				});
			});

			Promise.all(promises).then((values) => resolve(imageList));
		  });
		});
	  },

	getRequestUrl: function(librarySectionKey, year) {
		var start = moment().startOf('day').subtract(year, 'years').unix();
		var end = moment().endOf('day').subtract(year, 'years').unix();
		return `/library/sections/${librarySectionKey}/all?type=13&originallyAvailableAt>=${start}&originallyAvailableAt<=${end}`;
	}
});
