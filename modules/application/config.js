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
		srvUrl : "/cdb",
		
		// server url and db for couch
		dbUrl :  "/cdb/projack",
		lowId : "00000000000000000000000000000000",
		highId: "ffffffffffffffffffffffffffffffff",
		
		// server url for elasticsearch
		esUrl : '/es/pj',
		
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
		
		searchDelayTimeout : 350,
		
		// default options for tinymce
		tinyOptions : {
			menu : {},
			content_css : './resources/css/tinymce-style.css'
		}
}