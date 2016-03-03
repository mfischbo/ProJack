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

		// server url for couchdb
		srvUrl : "http://localhost:5984/",
	
		// url for the gitlab service
		enableGitLab : false,
		gitlabUrl : "http://devops.copilot-office.de:7000/api/v3",
		gitlabToken : 'ojgZXL8sxe7nkp97G_PE',
		
		// server url and db for couch
		dbUrl :  "http://localhost:5984/projack-dev",
		lowId : "00000000000000000000000000000000",
		highId: "ffffffffffffffffffffffffffffffff",
		
		// server url for elasticsearch
		esEndpoint  	: '/es',
		esIndex			: 'pj',
		esUrl 			: '/es/pj',
		
		// session key where user data is stored in the session storage
		sessionKey : "__ProJack_Session",
		
		// path to the application
		appUrl : "/projack",
		
		// the path to spring backend service
		serviceUrl : "/services",
		
		// time in ms how often the reminder api should be polled
		reminderPollTime : 60000,
		
		// enable / disable reminder polling
		reminderPollingEnabled : true,
	
		// timeout for ES queries on key up
		searchDelayTimeout : 350,
		
		// default options for tinymce
		tinyOptions : {
			menu : {},
			content_css : './resources/css/tinymce-style.css',
			height		: 'calc(100vh - 520px);',
			toolbar     : 'undo redo styleselect | bold italic strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist' 
		}
};
