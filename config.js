/*
 * Configuration file for this project.
 * Note that communication and authentication only works when we are on the same domain.
 * So for this particular setup srvUrl is configured to point to the host the site is
 * delivered from. In order to get this to work a apache proxy needs to be configured
 * to proxy all requests for /cdb to the actual couchdb server. 
 * Example in you apache config file:
 * 
 * ProxyPass /cdb		http://site.whereyour.couchdblives:port
 */
ProJack.config = {

		/**
		 * Server configuration
		 */
		// relative path to the application from the root of your server
		appUrl : "/projack",
		
		/**
		 * CouchDB Configuration
		 * You would definitly need this to be configured correctly
		 */
		
		// absolute url to couchdb
		srvUrl : "http://localhost:5984",
		
		// url to your database
		dbUrl :  "http://localhost:5984/projack-dev",

		/**
		 * Elasticsearch Configruation
		 * Is used for searching issues in the sprint and issue overviews
		 */
		// server url for elasticsearch
		esUrl 			: 'http://localhost:9200',
		
		// the name of the index that should be used
		esIndex			: 'projack',
		
		
		/**
		 * Gitlab Module
		 */
		// url for the gitlab service
		enableGitLab : false,
		gitlabUrl : "",		
		gitlabToken : '',
	

		/**
		 * Misc application configurations
		 */
		// enable / disable reminder polling
		reminderPollingEnabled : true,
	
		// time in ms how often the reminder api should be polled
		reminderPollTime : 60000,

		// timeout for ES queries on key up
		searchDelayTimeout : 350,
	
		// configuration for the tinymce editor
		tinyOptions : {
			menu : {},
			content_css : './resources/css/tinymce-style.css',
			height		: 'calc(100vh - 520px);',
			toolbar     : 'undo redo styleselect | bold italic strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist' 
		},
	
		
		/**
		 * No changes need to be made beyond this point
		 */
		// server url and db for couch
		lowId : "00000000000000000000000000000000",
		highId: "ffffffffffffffffffffffffffffffff",
		
		// session key where user data is stored in the session storage
		sessionKey : "__ProJack_Session"
};