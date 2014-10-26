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
		srvUrl : "/cdb",
		dbUrl :  "/cdb/projack",
		lowId : "00000000000000000000000000000000",
		highId: "ffffffffffffffffffffffffffffffff",
		sessionKey : "__ProJack_Session",
		appUrl : "/projack"
}