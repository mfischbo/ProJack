ProJack.security = angular.module("SecurityModule", ['Utils']);
ProJack.security.service("SecurityService", ['$http', function($http) {
	
	return {
	
		newUser : function() {
			return { 
				name : "",
				password : "",
				roles : [],
				type : "user"
			}
		},
		
		createAdminUser : function(user) {
			return $http.put(ProJack.config.srvUrl + "/_config/admins/" + user.name, user.password)
				.then(function(response) {
					return response.data;
				});
		},
		
		createUser : function(user) {
			return $http.put(ProJack.config.srvUrl + "/_users/org.couchdb.user:" + user.name, user)
				.then(function(response) {
					return response.data;
				});
		},
		
		login : function(username, password) {
			return $http.post(ProJack.config.srvUrl + "/_session", {name : username, password : password })
				.then(function(response) {
					return response.data;
				});
		},
		
		getCurrentSession : function() {
			return $http.get(ProJack.config.srvUrl + "/_session").then(function(response) {
				return response.data;
			});
		},
		
		getCurrentUserName : function() {
			this.getCurrentSession().then(function(data) {
				return data.name;
			});
		},
		
		logout : function() {
			return $http({
				method : 'DELETE',
				url    : ProJack.config.srvUrl + "_session"
			}).then(function(response) {
				return response.data;
			});
		}
	};
}]);
